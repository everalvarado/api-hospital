// Controlador de HORARIOS de atención de los médicos (tabla HORARIO_MEDICO)
const { HorarioMedico, Persona, Consultorio } = require('../models');
const { HttpError } = require('../middlewares/errores');
const { disponibilidad } = require('../utils/agenda');
const { tieneRol } = require('../utils/roles');

// GET /horarios?id_medico=
async function listar(req, res) {
  const horarios = await HorarioMedico.findAll({
    where: req.query.id_medico ? { id_medico: req.query.id_medico } : {},
    include: [
      { model: Persona, as: 'medico', attributes: ['nombre', 'apellido'] },
      { model: Consultorio, as: 'consultorio', attributes: ['numero'] },
    ],
    order: [['id_medico', 'ASC'], ['dia_semana', 'ASC'], ['hora_inicio', 'ASC']],
  });
  res.json(horarios.map((h) => {
    const x = h.get({ plain: true });
    return {
      id_horario: x.id_horario,
      id_medico: x.id_medico,
      medico: `${x.medico.nombre} ${x.medico.apellido}`,
      dia_semana: x.dia_semana,
      dia: x.dia,
      hora_inicio: x.hora_inicio,
      hora_fin: x.hora_fin,
      duracion_minutos: x.duracion_minutos,
      id_consultorio: x.id_consultorio,
      consultorio: x.consultorio?.numero ?? null,
    };
  }));
}

// GET /horarios/disponibles?id_medico=&fecha=YYYY-MM-DD
async function disponibles(req, res) {
  const { id_medico, fecha } = req.query;
  if (!id_medico || !fecha) throw new HttpError(400, 'id_medico y fecha son obligatorios');
  res.json(await disponibilidad(Number(id_medico), fecha));
}

// POST /horarios   (administrador)
// body: { id_medico, dia_semana, hora_inicio, hora_fin, duracion_minutos?, id_consultorio? }
async function crear(req, res) {
  const b = req.body || {};
  if (!b.id_medico || b.dia_semana === undefined || b.dia_semana === '' || !b.hora_inicio || !b.hora_fin) {
    throw new HttpError(400, 'Médico, día, hora de inicio y hora de fin son obligatorios');
  }
  if (b.hora_fin <= b.hora_inicio) throw new HttpError(400, 'La hora de fin debe ser posterior a la de inicio');
  if (!(await tieneRol(b.id_medico, 'Médico'))) throw new HttpError(400, 'La persona no tiene el rol Médico');
  const horario = await HorarioMedico.create({
    id_medico: b.id_medico,
    dia_semana: Number(b.dia_semana),
    hora_inicio: b.hora_inicio,
    hora_fin: b.hora_fin,
    duracion_minutos: b.duracion_minutos || 30,
    id_consultorio: b.id_consultorio || null,
  });
  res.status(201).json(horario);
}

// DELETE /horarios/:id   (administrador)
async function eliminar(req, res) {
  await HorarioMedico.destroy({ where: { id_horario: req.params.id } });
  res.json({ ok: true });
}

module.exports = { listar, disponibles, crear, eliminar };
