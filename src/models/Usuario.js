// Tabla USUARIO: credenciales para acceder al sistema
const { DataTypes } = require('sequelize');
const sequelize = require('../config');

const Usuario = sequelize.define('Usuario', {
  id_usuario: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre_usuario: { type: DataTypes.STRING(50), allowNull: false },
  contrasena: { type: DataTypes.STRING(255), allowNull: false }, // hash bcrypt
  estado: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'Activo' },
  id_persona: { type: DataTypes.INTEGER, allowNull: false },
}, {
  tableName: 'usuario',
  indexes: [{ name: 'ux_usuario_nombre', unique: true, fields: ['nombre_usuario'] }],
  // Nunca devolver la contraseña salvo que se pida explícitamente (Usuario.unscoped())
  defaultScope: { attributes: { exclude: ['contrasena'] } },
});

module.exports = Usuario;
