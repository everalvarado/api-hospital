// Controlador de CONSULTORIOS
const { Consultorio } = require('../models');
const { HttpError } = require('../middlewares/errores');

// GET /consultorios
async function listar(req, res) {
  res.json(await Consultorio.findAll({ order: [['numero', 'ASC']] }));
}

// POST /consultorios   (administrador)   body: { numero, descripcion }
async function crear(req, res) {
  const { numero, descripcion } = req.body || {};
  if (!numero) throw new HttpError(400, 'Número obligatorio');
  res.status(201).json(await Consultorio.create({ numero, descripcion: descripcion || null }));
}

// DELETE /consultorios/:id   (administrador)
async function eliminar(req, res) {
  await Consultorio.destroy({ where: { id_consultorio: req.params.id } });
  res.json({ ok: true });
}

module.exports = { listar, crear, eliminar };
