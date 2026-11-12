// Controlador de MÉDICOS
const { Persona, Rol, Especialidad, MedicoEspecialidad, HorarioMedico, Consultorio, PesoTalla, Turno } = require('../models');
const { HttpError } = require('../middlewares/errores');
const { listarTurnos } = require('../utils/turnos');
const { tieneRol } = require('../utils/roles');
const { iniciarSesion } = require('./authController');

/** Médicos con especialidades (y horarios si se piden) */
async function buscarMedicos({ idEspecialidad, idMedico, conHorarios = false } = {}) {
  const include = [
    { model: Rol, as: 'roles', where: { nombre_rol: 'Médico' }, attributes: [], through: { attributes: [] } },
    { model: Especialidad, as: 'especialidades', through: { attributes: [] } },
  ];
  if (conHorarios) include.push({ model: HorarioMedico, as: 'horarios', include: [{ model: Consultorio, as: 'consultorio', attributes: ['numero'] }] });
  const medicos = await Persona.findAll({
    where: idMedico ? { id_persona: idMedico } : {},
    include,
    order: [['apellido', 'ASC'], ['nombre', 'ASC']],
  });
  return medicos
    .map((m) => ({
      id_medico: m.id_persona,
      nombre: m.nombre,
      apellido: m.apellido,
      email: m.email,
      telefono: m.telefono,
      especialidades: m.especialidades.map((e) => ({ id: e.id_especialidad, nombre: e.nombre })),
      ...(conHorarios && {
        horarios: m.horarios
          .sort((a, b) => a.dia_semana - b.dia_semana || a.hora_inicio.localeCompare(b.hora_inicio))
          .map((h) => ({ id_horario: h.id_horario, dia_semana: h.dia_semana, dia: h.dia, hora_inicio: h.hora_inicio, hora_fin: h.hora_fin, duracion_minutos: h.duracion_minutos, consultorio: h.consultorio?.numero ?? null })),
      }),
    }))
    .filter((m) => !idEspecialidad || m.especialidades.some((e) => e.id === Number(idEspecialidad)));
}

// GET /medicos?especialidad=ID
async function listar(req, res) {
  res.json(await buscarMedicos({ idEspecialidad: req.query.especialidad }));
}

// GET /medicos/:id   (con especialidades y horarios)
async function obtener(req, res) {
  const [medico] = await buscarMedicos({ idMedico: req.params.id, conHorarios: true });
  if (!medico) throw new HttpError(404, 'Médico no encontrado');
  res.json(medico);
}

// POST /medicos/login   body: { usuario, contraseña }
async function login(req, res) {
  res.json(await iniciarSesion(req.body || {}, 'medico'));
}

/** Un médico solo ve lo suyo; administrador y enfermería ven todo */
function controlarAcceso(req, idMedico) {
  if (req.user.rol === 'medico' && Number(idMedico) !== req.user.id_persona) {
    throw new HttpError(403, 'Solo podés ver tu propia agenda');
  }
}

// GET /medicos/:id/turnos?fecha=&estado=
async function turnos(req, res) {
  controlarAcceso(req, req.params.id);
  res.json(await listarTurnos({ id_medico: req.params.id, fecha: req.query.fecha, estado: req.query.estado, id_paciente: req.query.id_paciente }));
}

// GET /medicos/:id/pacientes/:idPaciente  -> ficha + controles + turnos con ese médico
async function fichaPaciente(req, res) {
  controlarAcceso(req, req.params.id);
  const { id, idPaciente } = req.params;
  const propio = await Turno.count({ where: { id_paciente: idPaciente, id_medico: id } });
  if (!propio) throw new HttpError(403, 'Este paciente no tiene turnos con este médico');
  const [paciente, controles, turnosConMedico] = await Promise.all([
    Persona.findByPk(idPaciente, { include: [{ association: 'pais', attributes: ['nombre'] }] }),
    PesoTalla.findAll({ where: { id_paciente: idPaciente }, order: [['fecha_control', 'DESC'], ['id_control', 'DESC']] }),
    listarTurnos({ id_paciente: idPaciente, id_medico: id }),
  ]);
  res.json({ paciente, controles, turnos: turnosConMedico.reverse() });
}

// POST /medicos/:id/especialidades   body: { id_especialidad }
async function agregarEspecialidad(req, res) {
  const { id_especialidad } = req.body || {};
  if (!id_especialidad) throw new HttpError(400, 'Elegí una especialidad');
  if (!(await tieneRol(req.params.id, 'Médico'))) throw new HttpError(400, 'La persona no tiene el rol Médico');
  await MedicoEspecialidad.create({ id_medico: req.params.id, id_especialidad });
  res.status(201).json({ ok: true });
}

// DELETE /medicos/:id/especialidades/:idEspecialidad
async function quitarEspecialidad(req, res) {
  await MedicoEspecialidad.destroy({ where: { id_medico: req.params.id, id_especialidad: req.params.idEspecialidad } });
  res.json({ ok: true });
}

module.exports = { listar, obtener, login, turnos, fichaPaciente, agregarEspecialidad, quitarEspecialidad, buscarMedicos };
