// Controlador de TURNOS
const { Op, QueryTypes } = require('sequelize');
const { sequelize, Turno, MedicoEspecialidad } = require('../models');
const { HttpError } = require('../middlewares/errores');
const { listarTurnos } = require('../utils/turnos');
const { disponibilidad, CUPOS_PRIORIDAD } = require('../utils/agenda');

// GET /turnos?fecha=&estado=&id_medico=&id_paciente=
// Paciente: solo los suyos · Médico: solo los suyos · Enfermero y administrador: todos
async function listar(req, res) {
  const filtros = { fecha: req.query.fecha, estado: req.query.estado, id_medico: req.query.id_medico, id_paciente: req.query.id_paciente };
  if (req.user.rol === 'paciente') filtros.id_paciente = req.user.id_persona;
  if (req.user.rol === 'medico') filtros.id_medico = req.user.id_persona;
  res.json(await listarTurnos(filtros));
}

/**
 * POST /turnos   (paciente)
 * body: { id_medico, id_especialidad?, fecha, hora, motivo?, prioridad_comunidad }
 * Regla 2: se reservan CUPOS_PRIORIDAD turnos por médico y día para pacientes
 * de parajes o comunidades lejanas.
 */
async function crear(req, res) {
  const { id_medico, id_especialidad, fecha, hora, motivo, prioridad_comunidad } = req.body || {};
  if (!id_medico || !fecha || !hora) throw new HttpError(400, 'Médico, fecha y hora son obligatorios');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) throw new HttpError(400, 'Fecha inválida');
  if (fecha < new Date().toISOString().slice(0, 10)) throw new HttpError(400, 'No se pueden pedir turnos en fechas pasadas');
  if (motivo && String(motivo).length > 200) throw new HttpError(400, 'El motivo puede tener hasta 200 caracteres');
  if (id_especialidad) {
    const atiende = await MedicoEspecialidad.count({ where: { id_medico, id_especialidad } });
    if (!atiende) throw new HttpError(400, 'El médico no atiende esa especialidad');
  }

  const turno = await sequelize.transaction(async (transaction) => {
    // Bloqueo por médico + fecha para que dos pacientes no tomen el mismo cupo a la vez
    await sequelize.query('SELECT pg_advisory_xact_lock(:medico, :dia)', {
      replacements: { medico: Number(id_medico), dia: Number(fecha.replace(/-/g, '')) },
      type: QueryTypes.SELECT,
      transaction,
    });

    const yaTiene = await Turno.count({
      where: { id_paciente: req.user.id_persona, id_medico, fecha, estado: { [Op.ne]: 'Cancelado' } },
      transaction,
    });
    if (yaTiene) throw new HttpError(409, 'Ya tenés un turno con este médico para ese día');

    const disp = await disponibilidad(Number(id_medico), fecha, transaction);
    if (!disp.atiende) throw new HttpError(400, `El médico no atiende ese día. Atiende: ${disp.diasAtencion.join(', ') || 'sin horarios cargados'}`);
    const slot = disp.slots.find((s) => s.hora === hora);
    if (!slot) throw new HttpError(400, 'Horario fuera de la agenda del médico');
    if (!slot.libre) throw new HttpError(409, 'Ese horario ya fue tomado');
    if (!prioridad_comunidad && !disp.permiteNormal) {
      throw new HttpError(409, `Los últimos ${CUPOS_PRIORIDAD} turnos del día están reservados para pacientes de parajes o comunidades lejanas.`);
    }

    return Turno.create({
      fecha, hora, estado: 'Pendiente',
      prioridad_comunidad: !!prioridad_comunidad,
      id_paciente: req.user.id_persona,
      id_medico,
      id_especialidad: id_especialidad || null,
      motivo: motivo ? String(motivo).trim() : null,
    }, { transaction });
  });
  res.status(201).json(turno);
}

/**
 * PATCH /turnos/:id/aprobar   (enfermero)   body: { id_consultorio }
 * El trigger de PostgreSQL valida la Regla 1 (control verificado previo)
 * y asocia el turno al control verificado más reciente (Regla 3).
 */
async function aprobar(req, res) {
  const idConsultorio = req.body?.id_consultorio;
  if (!idConsultorio) throw new HttpError(400, 'Seleccioná un consultorio para aprobar el turno');
  const [n] = await Turno.update(
    { estado: 'Aprobado', id_consultorio: idConsultorio },
    { where: { id_turno: req.params.id, estado: 'Pendiente' } },
  );
  if (!n) throw new HttpError(400, 'Solo se pueden aprobar turnos pendientes');
  const turno = await Turno.findByPk(req.params.id);
  res.json({ ok: true, id_turno: turno.id_turno, id_control: turno.id_control });
}

// PATCH /turnos/:id/cancelar   (paciente: solo los suyos · enfermero · administrador)
async function cancelar(req, res) {
  const where = { id_turno: req.params.id, estado: { [Op.in]: ['Pendiente', 'Aprobado'] } };
  if (req.user.rol === 'paciente') where.id_paciente = req.user.id_persona;
  const [n] = await Turno.update({ estado: 'Cancelado' }, { where });
  if (!n) throw new HttpError(400, 'Solo se pueden cancelar turnos pendientes o aprobados');
  res.json({ ok: true });
}

// PATCH /turnos/:id/atender   (médico: solo los suyos)
async function atender(req, res) {
  const [n] = await Turno.update({ estado: 'Atendido' },
    { where: { id_turno: req.params.id, id_medico: req.user.id_persona, estado: 'Aprobado' } });
  if (!n) throw new HttpError(400, 'Solo se pueden marcar como atendidos los turnos aprobados propios');
  res.json({ ok: true });
}

// GET /turnos/prioridad   (administrador) -> control de la Regla 2 en los próximos 14 días
async function prioridad(req, res) {
  const filas = await sequelize.query(`
    SELECT to_char(d, 'YYYY-MM-DD')                                         AS fecha,
           COUNT(t.id_turno)::int                                        AS total_turnos,
           COUNT(t.id_turno) FILTER (WHERE t.prioridad_comunidad)::int   AS turnos_prioridad,
           COUNT(t.id_turno) FILTER (WHERE t.prioridad_comunidad) >= 2   AS cumple_regla
      FROM generate_series(CURRENT_DATE, CURRENT_DATE + 13, '1 day') d
      LEFT JOIN turno t ON t.fecha = d::date AND t.estado <> 'Cancelado'
     GROUP BY d
     ORDER BY d`, { type: QueryTypes.SELECT });
  res.json(filas);
}

module.exports = { listar, crear, aprobar, cancelar, atender, prioridad };
