// =============================================================
//  CONEXIÓN CON LA BASE DE DATOS (PostgreSQL + Sequelize)
//  - Local: DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, DB_PORT del .env
//  - Render: DATABASE_URL (la carga Render automáticamente)
// =============================================================
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env'), quiet: true });
const { Sequelize } = require('sequelize');

const usarSSL = process.env.DB_SSL === 'true';
const opciones = {
  dialect: 'postgres',
  logging: false,
  dialectOptions: usarSSL ? { ssl: { require: true, rejectUnauthorized: false } } : {},
  define: {
    timestamps: false,     // las tablas del diagrama no tienen createdAt / updatedAt
    freezeTableName: true, // no pluralizar nombres de tabla
  },
};

const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, opciones)
  : new Sequelize(
      process.env.DB_NAME || 'hospital_db',
      process.env.DB_USER || 'postgres',
      process.env.DB_PASSWORD || '1234',
      {
        ...opciones,
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
      },
    );

module.exports = sequelize;
