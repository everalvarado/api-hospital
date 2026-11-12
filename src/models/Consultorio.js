// Tabla CONSULTORIO: consultorios disponibles
const { DataTypes } = require('sequelize');
const sequelize = require('../config');

const Consultorio = sequelize.define('Consultorio', {
  id_consultorio: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  numero: { type: DataTypes.INTEGER, allowNull: false },
  descripcion: { type: DataTypes.STRING(100) },
}, { tableName: 'consultorio', indexes: [{ name: 'ux_consultorio_numero', unique: true, fields: ['numero'] }] });

module.exports = Consultorio;
