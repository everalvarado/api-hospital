// Crea la base de datos (DB_NAME) si todavía no existe. Solo en local:
// en Render la base ya viene creada (DATABASE_URL).
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env'), quiet: true });
const { Client } = require('pg');

async function crearBaseSiFalta() {
  if (process.env.DATABASE_URL) return;
  const nombre = process.env.DB_NAME || 'hospital_db';
  const cliente = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '1234',
    database: 'postgres',
  });
  try {
    await cliente.connect();
    const r = await cliente.query('SELECT 1 FROM pg_database WHERE datname = $1', [nombre]);
    if (r.rowCount === 0) {
      await cliente.query(`CREATE DATABASE "${nombre.replace(/"/g, '')}"`);
      console.log(`Base de datos "${nombre}" creada`);
    }
  } catch (error) {
    // Si no se puede crear (permisos, etc.) seguimos: sequelize.authenticate() informa el problema
    if (error.code === '42501') console.log(`No tengo permiso para crear "${nombre}": creala en pgAdmin (CREATE DATABASE ${nombre};)`);
  } finally {
    await cliente.end().catch(() => {});
  }
}

module.exports = crearBaseSiFalta;
