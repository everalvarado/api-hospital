// Tabla MEDICO_ESPECIALIDAD: relación entre médicos y sus especialidades
const { DataTypes } = require('sequelize');
const sequelize = require('../config');

const MedicoEspecialidad = sequelize.define('MedicoEspecialidad', {
  id_medico: { type: DataTypes.INTEGER, primaryKey: true },
  id_especialidad: { type: DataTypes.INTEGER, primaryKey: true },
}, { tableName: 'medico_especialidad' });

module.exports = MedicoEspecialidad;
