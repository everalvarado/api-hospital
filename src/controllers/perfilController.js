// Controlador de PERFIL: datos propios del usuario logueado
const { Persona, Pais } = require('../models');

const EDITABLES = ['telefono', 'email', 'direccion', 'ciudad', 'id_pais', 'obra_social', 'numero_afiliado'];

// GET /perfil
async function obtener(req, res) {
  res.json(await Persona.findByPk(req.user.id_persona, { include: [{ model: Pais, as: 'pais', attributes: ['nombre'] }] }));
}

// PUT /perfil   (solo datos de contacto y cobertura)
async function editar(req, res) {
  const b = req.body || {};
  const cambios = Object.fromEntries(EDITABLES.filter((k) => k in b).map((k) => [k, b[k] === '' ? null : b[k]]));
  await Persona.update(cambios, { where: { id_persona: req.user.id_persona } });
  res.json({ ok: true });
}

module.exports = { obtener, editar };
