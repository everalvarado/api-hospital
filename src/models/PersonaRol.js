// Tabla PERSONA_ROL: asigna roles a las personas (una persona puede tener varios)
const { DataTypes } = require('sequelize');
const sequelize = require('../config');

const PersonaRol = sequelize.define('PersonaRol', {
  id_persona: { type: DataTypes.INTEGER, primaryKey: true },
  id_rol: { type: DataTypes.INTEGER, primaryKey: true },
}, { tableName: 'persona_rol' });

module.exports = PersonaRol;
