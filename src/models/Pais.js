// Tabla PAIS: catálogo de países
const { DataTypes } = require('sequelize');
const sequelize = require('../config');

const Pais = sequelize.define('Pais', {
  id_pais: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre: { type: DataTypes.STRING(60), allowNull: false },
}, { tableName: 'pais', indexes: [{ name: 'ux_pais_nombre', unique: true, fields: ['nombre'] }] });

module.exports = Pais;
