// Controlador de ESPECIALIDADES
const { Especialidad } = require('../models');
const { HttpError } = require('../middlewares/errores');

// GET /especialidades   (público)
async function listar(req, res) {
  res.json(await Especialidad.findAll({ order: [['nombre', 'ASC']] }));
}

// POST /especialidades   (administrador)
async function crear(req, res) {
  if (!req.body?.nombre) throw new HttpError(400, 'Nombre obligatorio');
  res.status(201).json(await Especialidad.create({ nombre: req.body.nombre.trim() }));
}

// DELETE /especialidades/:id   (administrador)
async function eliminar(req, res) {
  await Especialidad.destroy({ where: { id_especialidad: req.params.id } });
  res.json({ ok: true });
}

module.exports = { listar, crear, eliminar };
