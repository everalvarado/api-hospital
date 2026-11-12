// Controlador de PERSONAS (y sus roles)
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { sequelize, Persona, Usuario, Rol, PersonaRol, Pais, PesoTalla } = require('../models');
const { HttpError } = require('../middlewares/errores');
const { datosPersona } = require('./authController');

// GET /personas?q=texto&rol=Paciente
// Administrador: todas · Enfermero: solo pacientes (para registrar controles)
async function listar(req, res) {
  const rol = req.user.rol === 'enfermero' ? 'Paciente' : req.query.rol;
  const q = req.query.q ? `%${req.query.q}%` : null;
  const personas = await Persona.findAll({
    where: {
      ...(q && { [Op.or]: [{ nombre: { [Op.iLike]: q } }, { apellido: { [Op.iLike]: q } }, { dni: { [Op.iLike]: q } }] }),
      ...(rol && { id_persona: { [Op.in]: sequelize.literal(`(SELECT pr.id_persona FROM persona_rol pr JOIN rol r ON r.id_rol = pr.id_rol WHERE r.nombre_rol = ${sequelize.escape(rol)})`) } }),
    },
    include: [
      { model: Usuario, as: 'usuarios' },
      { model: Rol, as: 'roles', through: { attributes: [] } },
      { model: Pais, as: 'pais', attributes: ['nombre'] },
      { model: PesoTalla, as: 'controles', attributes: ['id_control'] },
    ],
    order: [['apellido', 'ASC'], ['nombre', 'ASC']],
  });
  res.json(personas.map((p) => {
    const { usuarios, roles, pais, controles, ...datos } = p.get({ plain: true });
    const u = usuarios[0] || {};
    return {
      ...datos,
      pais: pais?.nombre ?? null,
      controles: controles.length,
      id_usuario: u.id_usuario || null,
      nombre_usuario: u.nombre_usuario || null,
      estado: u.estado || null,
      roles: roles.map((r) => ({ id_rol: r.id_rol, nombre_rol: r.nombre_rol })),
    };
  }));
}

// POST /personas   (administrador)   body: datos + nombre_usuario? + contraseña? + roles: [id_rol]
async function crear(req, res) {
  const b = req.body || {};
  const contrasena = b['contraseña'] ?? b.contrasena;
  if (!b.dni || !b.nombre || !b.apellido) throw new HttpError(400, 'DNI, nombre y apellido son obligatorios');
  const idsRoles = Array.isArray(b.roles) ? b.roles.map(Number) : [];
  if (!idsRoles.length) throw new HttpError(400, 'Asigná al menos un rol');
  if (b.nombre_usuario && (!contrasena || String(contrasena).length < 6)) {
    throw new HttpError(400, 'La contraseña debe tener al menos 6 caracteres');
  }
  const persona = await sequelize.transaction(async (transaction) => {
    const p = await Persona.create(datosPersona(b), { transaction });
    if (b.nombre_usuario) {
      await Usuario.create({ nombre_usuario: b.nombre_usuario, contrasena: await bcrypt.hash(String(contrasena), 10), id_persona: p.id_persona }, { transaction });
    }
    await PersonaRol.bulkCreate(idsRoles.map((id_rol) => ({ id_persona: p.id_persona, id_rol })), { transaction });
    return p;
  });
  res.status(201).json({ id_persona: persona.id_persona });
}

// PUT /personas/:id   (administrador)
async function editar(req, res) {
  const [n] = await Persona.update(datosPersona(req.body || {}), { where: { id_persona: req.params.id } });
  if (!n) throw new HttpError(404, 'Persona no encontrada');
  res.json({ ok: true });
}

// PUT /personas/:id/roles   (administrador)   body: { roles: [id_rol, ...] }
async function cambiarRoles(req, res) {
  const idsRoles = Array.isArray(req.body?.roles) ? req.body.roles.map(Number) : [];
  if (!idsRoles.length) throw new HttpError(400, 'Asigná al menos un rol');
  const idPersona = Number(req.params.id);
  if (idPersona === req.user.id_persona) {
    const admin = await Rol.findOne({ where: { nombre_rol: 'Administrador' } });
    if (!idsRoles.includes(admin.id_rol)) throw new HttpError(400, 'No podés quitarte el rol de Administrador a vos mismo');
  }
  await sequelize.transaction(async (transaction) => {
    await PersonaRol.destroy({ where: { id_persona: idPersona }, transaction });
    await PersonaRol.bulkCreate(idsRoles.map((id_rol) => ({ id_persona: idPersona, id_rol })), { transaction });
  });
  res.json({ ok: true });
}

module.exports = { listar, crear, editar, cambiarRoles };
