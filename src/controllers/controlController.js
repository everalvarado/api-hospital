// Controlador de CONTROL de peso y talla (tabla PESO_TALLA)
const { Persona, PesoTalla, Turno } = require('../models');
const { HttpError } = require('../middlewares/errores');

/** Controles con nombre del paciente y de quien lo registró */
async function buscarControles(where) {
  const controles = await PesoTalla.findAll({
    where,
    include: [
      { model: Persona, as: 'paciente', attributes: ['nombre', 'apellido', 'dni'] },
      { model: Persona, as: 'enfermera', attributes: ['nombre', 'apellido'] },
    ],
    order: [['fecha_control', 'DESC'], ['id_control', 'DESC']],
    limit: 100,
  });
  return controles.map((c) => {
    const x = c.get({ plain: true });
    return {
      id_control: x.id_control,
      fecha_control: x.fecha_control,
      peso: x.peso,
      talla: x.talla,
      imc: x.imc,
      verificado: x.verificado,
      id_paciente: x.id_paciente,
      paciente: `${x.paciente.nombre} ${x.paciente.apellido}`,
      dni: x.paciente.dni,
      enfermera: `${x.enfermera.nombre} ${x.enfermera.apellido}`,
    };
  });
}

// GET /control?id_paciente=
// Paciente: los suyos · Médico: de sus pacientes · Enfermero y administrador: todos
async function listar(req, res) {
  let idPaciente = req.query.id_paciente;
  if (req.user.rol === 'paciente') idPaciente = req.user.id_persona;
  if (req.user.rol === 'medico') {
    if (!idPaciente) throw new HttpError(400, 'Indicá id_paciente');
    const propio = await Turno.count({ where: { id_paciente: idPaciente, id_medico: req.user.id_persona } });
    if (!propio) throw new HttpError(403, 'Este paciente no tiene turnos con usted');
  }
  res.json(await buscarControles(idPaciente ? { id_paciente: idPaciente } : {}));
}

// POST /control   (enfermero)   body: { id_paciente, peso, talla, fecha_control?, verificado? }
async function crear(req, res) {
  const { id_paciente, peso, talla, fecha_control, verificado } = req.body || {};
  if (!id_paciente || !peso || !talla) throw new HttpError(400, 'Paciente, peso y talla son obligatorios');
  if (peso <= 0 || peso > 400) throw new HttpError(400, 'Peso fuera de rango (kg)');
  if (talla <= 0 || talla > 250) throw new HttpError(400, 'Talla fuera de rango (cm)');
  const control = await PesoTalla.create({
    fecha_control: fecha_control || undefined, // si no viene, usa la fecha de hoy
    peso, talla,
    verificado: !!verificado,
    id_paciente,
    id_enfermera: req.user.id_persona,
  });
  res.status(201).json(control);
}

// PATCH /control/:id/verificar   (enfermero)
async function verificar(req, res) {
  const [n] = await PesoTalla.update({ verificado: true }, { where: { id_control: req.params.id } });
  if (!n) throw new HttpError(404, 'Control no encontrado');
  res.json({ ok: true });
}

module.exports = { listar, crear, verificar };
