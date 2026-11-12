// Utilidades sobre roles de las personas
const { Rol, PersonaRol } = require('../models');

async function idRol(nombreRol) {
  const rol = await Rol.findOne({ where: { nombre_rol: nombreRol } });
  return rol ? rol.id_rol : null;
}

async function tieneRol(idPersona, nombreRol, transaction) {
  const total = await PersonaRol.count({
    where: { id_persona: idPersona },
    include: [{ model: Rol, as: 'rol', where: { nombre_rol: nombreRol } }],
    transaction,
  });
  return total > 0;
}

module.exports = { idRol, tieneRol };
