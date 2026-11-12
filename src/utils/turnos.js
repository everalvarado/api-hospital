// Consulta reutilizable de turnos con paciente, médico, consultorio y control
const { sequelize, Turno, Persona, Consultorio, PesoTalla, Especialidad } = require('../models');

const INCLUDES = [
  { model: Persona, as: 'paciente', attributes: ['nombre', 'apellido', 'dni'] },
  { model: Persona, as: 'medico', attributes: ['nombre', 'apellido'] },
  { model: Consultorio, as: 'consultorio', attributes: ['numero'] },
  { model: PesoTalla, as: 'control', attributes: ['peso', 'talla', 'fecha_control'] },
  { model: Especialidad, as: 'especialidad', attributes: ['nombre'] },
];

// ¿El paciente tiene un control de peso/talla verificado previo al turno? (Regla 1)
const TIENE_CONTROL = sequelize.literal(`EXISTS (
  SELECT 1 FROM peso_talla v
   WHERE v.id_paciente = "Turno"."id_paciente" AND v.verificado = TRUE
     AND v.fecha_control <= "Turno"."fecha")`);

/** Formato que espera el CLIENT */
function aJSON(t) {
  const x = t.get({ plain: true });
  return {
    id_turno: x.id_turno,
    fecha: x.fecha,
    hora: x.hora,
    estado: x.estado,
    prioridad_comunidad: x.prioridad_comunidad,
    id_paciente: x.id_paciente,
    paciente: x.paciente ? `${x.paciente.nombre} ${x.paciente.apellido}` : null,
    dni_paciente: x.paciente?.dni ?? null,
    id_medico: x.id_medico,
    medico: x.medico ? `${x.medico.nombre} ${x.medico.apellido}` : null,
    id_consultorio: x.id_consultorio,
    consultorio: x.consultorio?.numero ?? null,
    id_control: x.id_control,
    peso: x.control?.peso ?? null,
    talla: x.control?.talla ?? null,
    fecha_control: x.control?.fecha_control ?? null,
    id_especialidad: x.id_especialidad,
    especialidad: x.especialidad?.nombre ?? null,
    motivo: x.motivo,
    tiene_control_verificado: x.tiene_control_verificado === true || x.tiene_control_verificado === 't',
  };
}

/** Lista turnos con un filtro (where de Sequelize). Ignora filtros vacíos. */
async function listarTurnos(filtros = {}) {
  const where = Object.fromEntries(Object.entries(filtros).filter(([, v]) => v !== undefined && v !== null && v !== ''));
  const turnos = await Turno.findAll({
    where,
    include: INCLUDES,
    attributes: { include: [[TIENE_CONTROL, 'tiene_control_verificado']] },
    order: [['fecha', 'ASC'], ['hora', 'ASC']],
  });
  return turnos.map(aJSON);
}

module.exports = { listarTurnos };
