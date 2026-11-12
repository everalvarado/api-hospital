// Controlador de ESTADÍSTICAS (panel del administrador)
const { Op } = require('sequelize');
const { sequelize, Persona, Rol, PersonaRol, Consultorio, Turno } = require('../models');

// GET /estadisticas/resumen
async function resumen(req, res) {
  const conRol = (nombre) => PersonaRol.count({ include: [{ model: Rol, as: 'rol', where: { nombre_rol: nombre } }] });
  const [personas, turnosHoy, pendientes, consultorios, medicos, pacientes] = await Promise.all([
    Persona.count(),
    Turno.count({ where: { fecha: sequelize.literal('CURRENT_DATE'), estado: { [Op.ne]: 'Cancelado' } } }),
    Turno.count({ where: { estado: 'Pendiente' } }),
    Consultorio.count(),
    conRol('Médico'),
    conRol('Paciente'),
  ]);
  res.json({ personas, turnos_hoy: turnosHoy, pendientes, consultorios, medicos, pacientes });
}

module.exports = { resumen };
