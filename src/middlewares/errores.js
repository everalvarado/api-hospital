// Manejo central de errores: traduce errores de Sequelize / PostgreSQL a mensajes claros

/** Envuelve controladores async para que sus errores lleguen a este middleware */
const ah = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const MENSAJES_CONEXION = {
  ECONNREFUSED: 'No se pudo conectar a PostgreSQL. ¿Está iniciado? Revisá DB_HOST y DB_PORT en .env',
  ENOTFOUND: 'No se encontró el servidor de PostgreSQL. Revisá DB_HOST o DATABASE_URL.',
  '28P01': 'PostgreSQL rechazó el usuario o la contraseña. Revisá DB_USER y DB_PASSWORD en .env',
  '28000': 'PostgreSQL rechazó la conexión. Revisá usuario, contraseña o DB_SSL.',
  '3D000': 'La base de datos no existe. Creala en pgAdmin: CREATE DATABASE hospital_db;',
  '42P01': 'Faltan tablas en la base de datos. Reiniciá la API para que las cree (o ejecutá "npm run db:reset").',
};

function manejarErrores(err, req, res, _next) {
  if (err.status) return res.status(err.status).json({ error: err.message });

  const codigo = err.original?.code || err.parent?.code || err.code;
  if (MENSAJES_CONEXION[codigo]) return res.status(503).json({ error: MENSAJES_CONEXION[codigo] });

  switch (err.name) {
    case 'SequelizeUniqueConstraintError':
      return res.status(409).json({ error: 'Ya existe un registro con esos datos (duplicado).' });
    case 'SequelizeForeignKeyConstraintError':
      return res.status(400).json({ error: 'Referencia inválida o el registro está en uso.' });
    case 'SequelizeValidationError':
      return res.status(400).json({ error: err.errors?.map((e) => e.message).join(', ') || 'Datos inválidos' });
    case 'SequelizeConnectionRefusedError':
    case 'SequelizeConnectionError':
    case 'SequelizeHostNotFoundError':
      return res.status(503).json({ error: 'No se pudo conectar a la base de datos.' });
    default:
      break;
  }

  switch (codigo) {
    case 'P0001': // RAISE EXCEPTION de los triggers (reglas del sistema)
      return res.status(400).json({ error: (err.original || err.parent || err).message });
    case '23514':
      return res.status(400).json({ error: 'Algún dato no cumple las restricciones (valores inválidos).' });
    case '22P02':
    case '22007':
    case '22008':
      return res.status(400).json({ error: 'Formato de dato inválido.' });
    default:
      console.error(err);
      return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

module.exports = { ah, HttpError, manejarErrores, MENSAJES_CONEXION };
