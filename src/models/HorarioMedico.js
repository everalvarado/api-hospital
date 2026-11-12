// Tabla HORARIO_MEDICO: días y horas en que atiende cada médico
const { DataTypes } = require('sequelize');
const sequelize = require('../config');

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const hhmm = (campo) => ({
  type: DataTypes.TIME,
  allowNull: false,
  get() { const v = this.getDataValue(campo); return v ? String(v).slice(0, 5) : v; },
});

const HorarioMedico = sequelize.define('HorarioMedico', {
  id_horario: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_medico: { type: DataTypes.INTEGER, allowNull: false },
  dia_semana: { type: DataTypes.SMALLINT, allowNull: false, validate: { min: 0, max: 6 } }, // 0 = domingo
  hora_inicio: hhmm('hora_inicio'),
  hora_fin: hhmm('hora_fin'),
  duracion_minutos: { type: DataTypes.SMALLINT, allowNull: false, defaultValue: 30, validate: { min: 5, max: 240 } },
  id_consultorio: { type: DataTypes.INTEGER },
  // Campo calculado: nombre del día
  dia: { type: DataTypes.VIRTUAL, get() { return DIAS[this.getDataValue('dia_semana')]; } },
}, {
  tableName: 'horario_medico',
  indexes: [{ name: 'ix_horario_medico', fields: ['id_medico', 'dia_semana'] }],
  validate: {
    finPosteriorAlInicio() {
      if (this.hora_fin <= this.hora_inicio) throw new Error('La hora de fin debe ser posterior a la de inicio');
    },
  },
});

HorarioMedico.DIAS = DIAS;
module.exports = HorarioMedico;
