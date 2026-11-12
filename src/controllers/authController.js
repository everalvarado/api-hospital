// Controlador de AUTENTICACIÓN: login y registro de pacientes
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sequelize, Usuario, Persona, Rol, PersonaRol } = require('../models');
const { ROLES } = require('../middlewares/auth');
const { HttpError } = require('../middlewares/errores');

// Si el usuario tiene varios roles y no elige uno, entra con el primero de esta lista
const PRIORIDAD_ROLES = ['admin', 'medico', 'enfermero', 'paciente'];
const slugDeRol = (nombre) => Object.keys(ROLES).find((k) => ROLES[k] === nombre);

/** Acepta "contraseña" (con ñ, como el otro proyecto) o "contrasena" */
const leerContrasena = (body) => body['contraseña'] ?? body.contrasena ?? body.password;

/** Lógica de login compartida por POST /auth/login y POST /medicos/login */
async function iniciarSesion(body, rolForzado) {
  const usuario = String(body.usuario || '').trim();
  const contrasena = leerContrasena(body);
  const rol = rolForzado || body.rol;
  if (!usuario || !contrasena) throw new HttpError(400, 'Completá usuario y contraseña');
  if (rol && !ROLES[rol]) throw new HttpError(400, 'Rol inválido');

  const u = await Usuario.unscoped().findOne({
    where: { nombre_usuario: usuario },
    include: [{ model: Persona, as: 'persona', include: [{ model: Rol, as: 'roles', through: { attributes: [] } }] }],
  });
  if (!u) throw new HttpError(401, `No existe el usuario "${usuario}"`);

  // Contraseña encriptada con bcrypt o, si se cargó a mano, en texto plano (se encripta al entrar)
  const guardada = String(u.contrasena || '').trim();
  const esHash = /^\$2[aby]\$\d{2}\$/.test(guardada);
  const ok = esHash ? await bcrypt.compare(String(contrasena), guardada) : guardada === String(contrasena);
  if (!ok) throw new HttpError(401, 'Contraseña incorrecta');
  if (!esHash) await Usuario.update({ contrasena: await bcrypt.hash(String(contrasena), 10) }, { where: { id_usuario: u.id_usuario } });
  if (u.estado !== 'Activo') throw new HttpError(403, 'El usuario está inactivo');

  const misRoles = u.persona.roles.map((r) => slugDeRol(r.nombre_rol)).filter(Boolean);
  let rolElegido = rol;
  if (rolElegido && !misRoles.includes(rolElegido)) throw new HttpError(403, `Este usuario no tiene el rol ${ROLES[rolElegido]}`);
  if (!rolElegido) rolElegido = PRIORIDAD_ROLES.find((r) => misRoles.includes(r));
  if (!rolElegido) throw new HttpError(403, 'El usuario no tiene roles asignados');

  const user = {
    id_usuario: u.id_usuario,
    id_persona: u.id_persona,
    usuario: u.nombre_usuario,
    nombre: `${u.persona.nombre} ${u.persona.apellido}`,
    rol: rolElegido,
    roles: misRoles,
  };
  const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES || '8h' });
  return { ok: true, token, user };
}

// POST /auth/login   body: { usuario, contraseña, rol? }
async function login(req, res) {
  res.json(await iniciarSesion(req.body || {}));
}

// POST /auth/registro-paciente
async function registroPaciente(req, res) {
  const b = req.body || {};
  const usuario = b.usuario || b.nombre_usuario;
  const contrasena = leerContrasena(b);
  if (!b.dni || !b.nombre || !b.apellido || !usuario || !contrasena) {
    throw new HttpError(400, 'DNI, nombre, apellido, usuario y contraseña son obligatorios');
  }
  if (String(contrasena).length < 6) throw new HttpError(400, 'La contraseña debe tener al menos 6 caracteres');

  const hash = await bcrypt.hash(String(contrasena), 10);
  const persona = await sequelize.transaction(async (transaction) => {
    const p = await Persona.create(datosPersona(b), { transaction });
    await Usuario.create({ nombre_usuario: usuario, contrasena: hash, id_persona: p.id_persona }, { transaction });
    const rolPaciente = await Rol.findOne({ where: { nombre_rol: 'Paciente' }, transaction });
    await PersonaRol.create({ id_persona: p.id_persona, id_rol: rolPaciente.id_rol }, { transaction });
    return p;
  });
  res.status(201).json({ ok: true, mensaje: 'Paciente registrado. Ya podés iniciar sesión.', id_persona: persona.id_persona });
}

// GET /auth/me
function yo(req, res) {
  res.json({ user: req.user });
}

/** Campos de PERSONA que se pueden cargar desde un formulario */
function datosPersona(b) {
  const v = (x) => (x === undefined || x === '' ? null : x);
  return {
    dni: b.dni,
    nombre: b.nombre,
    apellido: b.apellido,
    sexo: v(b.sexo),
    telefono: v(b.telefono),
    email: v(b.email),
    direccion: v(b.direccion),
    ciudad: v(b.ciudad),
    id_pais: v(b.id_pais),
    fecha_nacimiento: v(b.fecha_nacimiento),
    obra_social: v(b.obra_social),
    numero_afiliado: v(b.numero_afiliado),
  };
}

module.exports = { login, registroPaciente, yo, iniciarSesion, datosPersona };
