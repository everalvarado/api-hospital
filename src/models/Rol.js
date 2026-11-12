// Tabla ROL: catálogo de roles (Administrador, Enfermero, Médico, Paciente)
const { DataTypes } = require('sequelize');
const sequelize = require('../config');

const Rol = sequelize.define('Rol', {
  id_rol: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre_rol: { type: DataTypes.STRING(30), allowNull: false },
}, { tableName: 'rol', indexes: [{ name: 'ux_rol_nombre', unique: true, fields: ['nombre_rol'] }] });

module.exports = Rol;
