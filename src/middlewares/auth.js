// Verifica el token (JWT) y controla qué rol puede usar cada ruta
const jwt = require('jsonwebtoken');

// Slug que usa el CLIENT  ->  nombre_rol en la tabla ROL
const ROLES = {
  admin: 'Administrador',
  enfermero: 'Enfermero',
  medico: 'Médico',
  paciente: 'Paciente',
};

function verificarToken(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'No autenticado' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Sesión expirada o inválida' });
  }
}

/** Solo deja pasar a los roles indicados, por ejemplo permitirRol('admin') */
function permitirRol(...slugs) {
  return (req, res, next) => {
    if (!req.user || !slugs.includes(req.user.rol)) {
      return res.status(403).json({ error: 'No tenés permiso para esta acción' });
    }
    next();
  };
}

module.exports = { ROLES, verificarToken, permitirRol };
