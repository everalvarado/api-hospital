// Tabla TURNO: turnos agendados para atención médica
const { DataTypes, Op } = require('sequelize');
const sequelize = require('../config');

const ESTADOS = ['Pendiente', 'Aprobado', 'Cancelado', 'Atendido'];

const Turno = sequelize.define('Turno', {
  id_turno: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  fecha: { type: DataTypes.DATEONLY, allowNull: false },
  hora: {
    type: DataTypes.TIME,
    allowNull: false,
    get() { // '08:30:00' -> '08:30'
      const v = this.getDataValue('hora');
      return v ? String(v).slice(0, 5) : v;
    },
  },
  estado: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'Pendiente', validate: { isIn: [ESTADOS] } },
  prioridad_comunidad: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  id_paciente: { type: DataTypes.INTEGER, allowNull: false },
  id_medico: { type: DataTypes.INTEGER, allowNull: false },
  id_consultorio: { type: DataTypes.INTEGER },
  id_control: { type: DataTypes.INTEGER },
  id_especialidad: { type: DataTypes.INTEGER },
  motivo: { type: DataTypes.STRING(200) },
}, {
  tableName: 'turno',
  indexes: [
    // Un médico no puede tener dos turnos activos en la misma fecha y hora
    { name: 'ux_turno_medico_fecha_hora', unique: true, fields: ['id_medico', 'fecha', 'hora'], where: { estado: { [Op.ne]: 'Cancelado' } } },
    { name: 'ix_turno_fecha', fields: ['fecha'] },
    { name: 'ix_turno_paciente', fields: ['id_paciente'] },
  ],
});

Turno.ESTADOS = ESTADOS;
module.exports = Turno;
