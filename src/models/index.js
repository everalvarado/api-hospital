// =============================================================
//  MODELOS Y RELACIONES
//  Cada modelo es una tabla. Acá se arman TODAS las relaciones.
// =============================================================
const sequelize = require('../config');

const Persona = require('./Persona');
const Usuario = require('./Usuario');
const Rol = require('./Rol');
const PersonaRol = require('./PersonaRol');
const Especialidad = require('./Especialidad');
const MedicoEspecialidad = require('./MedicoEspecialidad');
const Consultorio = require('./Consultorio');
const PesoTalla = require('./PesoTalla');
const Turno = require('./Turno');
const Pais = require('./Pais');
const HorarioMedico = require('./HorarioMedico');

// PERSONA 1 ── N USUARIO
Persona.hasMany(Usuario, { foreignKey: 'id_persona', as: 'usuarios' });
Usuario.belongsTo(Persona, { foreignKey: 'id_persona', as: 'persona' });

// PERSONA N ── N ROL  (a través de PERSONA_ROL)
Persona.belongsToMany(Rol, { through: PersonaRol, foreignKey: 'id_persona', otherKey: 'id_rol', as: 'roles' });
Rol.belongsToMany(Persona, { through: PersonaRol, foreignKey: 'id_rol', otherKey: 'id_persona', as: 'personas' });
PersonaRol.belongsTo(Persona, { foreignKey: 'id_persona', as: 'persona' });
PersonaRol.belongsTo(Rol, { foreignKey: 'id_rol', as: 'rol' });

// MÉDICO (PERSONA) N ── N ESPECIALIDAD  (a través de MEDICO_ESPECIALIDAD)
Persona.belongsToMany(Especialidad, { through: MedicoEspecialidad, foreignKey: 'id_medico', otherKey: 'id_especialidad', as: 'especialidades' });
Especialidad.belongsToMany(Persona, { through: MedicoEspecialidad, foreignKey: 'id_especialidad', otherKey: 'id_medico', as: 'medicos' });

// PESO_TALLA: N controles por paciente; cada control lo registra una enfermera
Persona.hasMany(PesoTalla, { foreignKey: 'id_paciente', as: 'controles' });
PesoTalla.belongsTo(Persona, { foreignKey: 'id_paciente', as: 'paciente' });
PesoTalla.belongsTo(Persona, { foreignKey: 'id_enfermera', as: 'enfermera' });

// TURNO: paciente, médico, consultorio y control de peso/talla asociado
Persona.hasMany(Turno, { foreignKey: 'id_paciente', as: 'turnosComoPaciente' });
Persona.hasMany(Turno, { foreignKey: 'id_medico', as: 'turnosComoMedico' });
Turno.belongsTo(Persona, { foreignKey: 'id_paciente', as: 'paciente' });
Turno.belongsTo(Persona, { foreignKey: 'id_medico', as: 'medico' });
Consultorio.hasMany(Turno, { foreignKey: 'id_consultorio', as: 'turnos' });
Turno.belongsTo(Consultorio, { foreignKey: 'id_consultorio', as: 'consultorio' });
PesoTalla.hasMany(Turno, { foreignKey: 'id_control', as: 'turnos' });
Turno.belongsTo(PesoTalla, { foreignKey: 'id_control', as: 'control' });

// TURNO N ── 1 ESPECIALIDAD (especialidad consultada)
Especialidad.hasMany(Turno, { foreignKey: 'id_especialidad', as: 'turnos' });
Turno.belongsTo(Especialidad, { foreignKey: 'id_especialidad', as: 'especialidad' });

// PAIS 1 ── N PERSONA
Pais.hasMany(Persona, { foreignKey: 'id_pais', as: 'personas' });
Persona.belongsTo(Pais, { foreignKey: 'id_pais', as: 'pais' });

// HORARIO_MEDICO: N horarios por médico, cada uno en un consultorio
Persona.hasMany(HorarioMedico, { foreignKey: 'id_medico', as: 'horarios' });
HorarioMedico.belongsTo(Persona, { foreignKey: 'id_medico', as: 'medico' });
Consultorio.hasMany(HorarioMedico, { foreignKey: 'id_consultorio', as: 'horarios' });
HorarioMedico.belongsTo(Consultorio, { foreignKey: 'id_consultorio', as: 'consultorio' });

module.exports = {
  sequelize,
  Persona,
  Usuario,
  Rol,
  PersonaRol,
  Especialidad,
  MedicoEspecialidad,
  Consultorio,
  PesoTalla,
  Turno,
  Pais,
  HorarioMedico,
};
