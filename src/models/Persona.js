// Tabla PERSONA: datos personales de todas las personas
const { DataTypes } = require('sequelize');
const sequelize = require('../config');

const Persona = sequelize.define('Persona', {
  id_persona: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  dni: { type: DataTypes.STRING(15), allowNull: false },
  nombre: { type: DataTypes.STRING(50), allowNull: false },
  apellido: { type: DataTypes.STRING(50), allowNull: false },
  sexo: { type: DataTypes.STRING(1), validate: { isIn: [['F', 'M', 'X']] } },
  telefono: { type: DataTypes.STRING(20) },
  email: { type: DataTypes.STRING(100) },
  direccion: { type: DataTypes.STRING(100) },
  ciudad: { type: DataTypes.STRING(80) },
  id_pais: { type: DataTypes.INTEGER },
  fecha_nacimiento: { type: DataTypes.DATEONLY },
  obra_social: { type: DataTypes.STRING(80) },
  numero_afiliado: { type: DataTypes.STRING(30) },
  matricula: { type: DataTypes.STRING(20) }, // solo médicos (ej. MP001)
}, {
  tableName: 'persona',
  indexes: [{ name: 'ux_persona_dni', unique: true, fields: ['dni'] }],
});

module.exports = Persona;
