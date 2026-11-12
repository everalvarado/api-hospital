// Controlador de PAÍSES
const { Pais } = require('../models');
const { HttpError } = require('../middlewares/errores');

// GET /paises   (público: lo usa el formulario de registro)
async function listar(req, res) {
  res.json(await Pais.findAll({ order: [['nombre', 'ASC']] }));
}

// POST /paises   (administrador)   body: { nombre }
async function crear(req, res) {
  if (!req.body?.nombre) throw new HttpError(400, 'Nombre obligatorio');
  res.status(201).json(await Pais.create({ nombre: req.body.nombre.trim() }));
}

// DELETE /paises/:id   (administrador)
async function eliminar(req, res) {
  await Pais.destroy({ where: { id_pais: req.params.id } });
  res.json({ ok: true });
}

module.exports = { listar, crear, eliminar };
