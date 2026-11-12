// npm run db:reset  -> BORRA todas las tablas, las vuelve a crear y carga los datos iniciales.
// Usalo si cambiás un modelo o querés volver a empezar con los datos de prueba.
const sequelize = require('../config');
require('../models');
const seedInicial = require('./seeders/seedInicial');
const crearBaseSiFalta = require('./crearBase');

(async () => {
  try {
    await crearBaseSiFalta();
    await sequelize.sync({ force: true });
    console.log('Tablas recreadas');
    await seedInicial();
    console.log('Listo. Ahora ejecutá: npm run dev');
  } catch (error) {
    console.error('Error:', error.message);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
})();
