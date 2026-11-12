// Agenda: horarios disponibles según HORARIO_MEDICO y reserva de cupos de prioridad (Regla 2)
const { Op } = require('sequelize');
const { Turno, HorarioMedico } = require('../models');

const CUPOS_PRIORIDAD = Number(process.env.CUPOS_PRIORIDAD || 2);

const aMin = (h) => { const [hh, mm] = String(h).split(':').map(Number); return hh * 60 + mm; };
const aHora = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

/** Día de la semana (0 = domingo) de una fecha 'YYYY-MM-DD' */
const diaSemana = (fecha) => new Date(`${fecha}T12:00:00Z`).getUTCDay();

/** Genera los horarios de turno de un médico para una fecha según su HORARIO_MEDICO */
async function slotsDelDia(idMedico, fecha, transaction) {
  const horarios = await HorarioMedico.findAll({
    where: { id_medico: idMedico, dia_semana: diaSemana(fecha) },
    order: [['hora_inicio', 'ASC']],
    transaction,
  });
  const slots = new Map(); // hora -> id_consultorio
  for (const h of horarios) {
    for (let m = aMin(h.hora_inicio); m + h.duracion_minutos <= aMin(h.hora_fin); m += h.duracion_minutos) {
      if (!slots.has(aHora(m))) slots.set(aHora(m), h.id_consultorio);
    }
  }
  return [...slots.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([hora, id_consultorio]) => ({ hora, id_consultorio }));
}

/**
 * Disponibilidad de un médico en una fecha. Se reservan CUPOS_PRIORIDAD
 * turnos por día para pacientes de parajes / comunidades lejanas.
 */
async function disponibilidad(idMedico, fecha, transaction) {
  const [delDia, todos, turnos] = await Promise.all([
    slotsDelDia(idMedico, fecha, transaction),
    HorarioMedico.findAll({ where: { id_medico: idMedico }, attributes: ['dia_semana'], transaction }),
    Turno.findAll({
      where: { id_medico: idMedico, fecha, estado: { [Op.ne]: 'Cancelado' } },
      attributes: ['hora', 'prioridad_comunidad'],
      transaction,
    }),
  ]);
  const diasAtencion = [...new Set(todos.map((h) => h.dia_semana))].sort().map((d) => HorarioMedico.DIAS[d]);
  const ocupadas = new Set(turnos.map((t) => t.hora));
  const prioridad = turnos.filter((t) => t.prioridad_comunidad).length;
  const normales = turnos.length - prioridad;
  const libres = delDia.filter((s) => !ocupadas.has(s.hora)).length;
  const reservados = Math.min(CUPOS_PRIORIDAD, delDia.length);

  return {
    fecha,
    atiende: delDia.length > 0,
    diasAtencion,
    slots: delDia.map((s) => ({ hora: s.hora, libre: !ocupadas.has(s.hora), id_consultorio: s.id_consultorio })),
    libres,
    turnosPrioridad: prioridad,
    cuposPrioridadReservados: Math.max(0, reservados - prioridad),
    permiteNormal: normales < delDia.length - reservados && libres > 0,
    permitePrioridad: libres > 0,
  };
}

module.exports = { disponibilidad, diaSemana, CUPOS_PRIORIDAD };
