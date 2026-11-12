// Tabla PESO_TALLA: controles de peso y talla realizados al paciente
const { DataTypes } = require('sequelize');
const sequelize = require('../config');

// PostgreSQL devuelve DECIMAL como texto: lo convertimos a número
const decimal = (campo) => ({
  type: DataTypes.DECIMAL(5, 2),
  allowNull: false,
  validate: { min: 0.01 },
  get() {
    const v = this.getDataValue(campo);
    return v === null || v === undefined ? v : parseFloat(v);
  },
});

const PesoTalla = sequelize.define('PesoTalla', {
  id_control: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  fecha_control: { type: DataTypes.DATEONLY, allowNull: false, defaultValue: DataTypes.NOW },
  peso: decimal('peso'),   // kg
  talla: decimal('talla'), // cm
  verificado: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  id_paciente: { type: DataTypes.INTEGER, allowNull: false },
  id_enfermera: { type: DataTypes.INTEGER, allowNull: false },
  // Campo calculado (no existe en la tabla): índice de masa corporal
  imc: {
    type: DataTypes.VIRTUAL,
    get() {
      const peso = parseFloat(this.getDataValue('peso'));
      const talla = parseFloat(this.getDataValue('talla'));
      if (!peso || !talla) return null;
      return Math.round((peso / Math.pow(talla / 100, 2)) * 10) / 10;
    },
  },
}, {
  tableName: 'peso_talla',
  indexes: [{ name: 'ix_peso_talla_paciente', fields: ['id_paciente', 'fecha_control'] }],
});

module.exports = PesoTalla;
