// Controlador de USUARIOS (credenciales)
const bcrypt = require('bcryptjs');
const { Usuario, Rol } = require('../models');
const { HttpError } = require('../middlewares/errores');

// GET /usuarios/roles   (administrador)
async function roles(req, res) {
  res.json(await Rol.findAll({ order: [['id_rol', 'ASC']] }));
}

// PATCH /usuarios/:id/estado   (administrador)   body: { estado: 'Activo' | 'Inactivo' }
async function cambiarEstado(req, res) {
  const { estado } = req.body || {};
  if (!['Activo', 'Inactivo'].includes(estado)) throw new HttpError(400, 'Estado inválido');
  if (Number(req.params.id) === req.user.id_usuario) throw new HttpError(400, 'No podés desactivar tu propio usuario');
  await Usuario.update({ estado }, { where: { id_usuario: req.params.id } });
  res.json({ ok: true });
}

// PATCH /usuarios/:id/contrasena   (administrador)   body: { contraseña }
async function cambiarContrasena(req, res) {
  const pass = String(req.body?.['contraseña'] ?? req.body?.contrasena ?? '');
  if (pass.length < 6) throw new HttpError(400, 'La contraseña debe tener al menos 6 caracteres');
  await Usuario.update({ contrasena: await bcrypt.hash(pass, 10) }, { where: { id_usuario: req.params.id } });
  res.json({ ok: true });
}

module.exports = { roles, cambiarEstado, cambiarContrasena };
