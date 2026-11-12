// Tabla ESPECIALIDAD: catálogo de especialidades médicas
const { DataTypes } = require('sequelize');
const sequelize = require('../config');

const Especialidad = sequelize.define('Especialidad', {
  id_especialidad: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre: { type: DataTypes.STRING(50), allowNull: false },
}, { tableName: 'especialidad', indexes: [{ name: 'ux_especialidad_nombre', unique: true, fields: ['nombre'] }] });

module.exports = Especialidad;
