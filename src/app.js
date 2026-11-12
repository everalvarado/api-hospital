// =============================================================
//  API HOSPITALARIA
//  Base: proyecto original (app.js, config, morgan, sync + seeder, puerto 3001)
//  Agregado: roles (admin, enfermero, médico, paciente), control de peso y
//  talla, horarios, países y las reglas del sistema del diagrama.
// =============================================================
const cors = require('cors');
const express = require('express');
const morgan = require('morgan');
const sequelize = require('./config');
require('./models');

const seedInicial = require('./database/seeders/seedInicial');
const crearBaseSiFalta = require('./database/crearBase');
const { manejarErrores, MENSAJES_CONEXION } = require('./middlewares/errores');

const authRoutes = require('./routes/auth');
const medicosRoutes = require('./routes/medicos');
const turnosRoutes = require('./routes/turnos');
const controlRoutes = require('./routes/control');
const paisesRoutes = require('./routes/paises');
const horariosRoutes = require('./routes/horarios');
// Rutas agregadas para los paneles de cada rol
const especialidadesRoutes = require('./routes/especialidades');
const consultoriosRoutes = require('./routes/consultorios');
const personasRoutes = require('./routes/personas');
const usuariosRoutes = require('./routes/usuarios');
const estadisticasRoutes = require('./routes/estadisticas');
const perfilRoutes = require('./routes/perfil');

const app = express();
const PORT = process.env.PORT || 3001;

if (!process.env.JWT_SECRET) {
  console.error('Falta JWT_SECRET en el archivo .env');
  process.exit(1);
}

app.use(express.json());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(morgan('dev'));

app.get('/', (req, res) => {
  res.json({
    ok: true,
    mensaje: 'API Hospitalaria funcionando',
    rutas: {
      login: 'POST /auth/login',
      registroPaciente: 'POST /auth/registro-paciente',
      medicos: 'GET /medicos',
      loginMedico: 'POST /medicos/login',
      turnosDelMedico: 'GET /medicos/:id/turnos',
      solicitarTurno: 'POST /turnos',
      listarTurnos: 'GET /turnos',
      controles: 'GET | POST /control',
      paises: 'GET /paises',
      horarios: 'GET /horarios',
      horariosDisponibles: 'GET /horarios/disponibles?id_medico=&fecha=',
    },
  });
});

app.get('/health', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ ok: true, db: 'conectada' });
  } catch (error) {
    res.status(503).json({ ok: false, db: 'sin conexión', error: error.message });
  }
});

app.use('/auth', authRoutes);
app.use('/medicos', medicosRoutes);
app.use('/turnos', turnosRoutes);
app.use('/control', controlRoutes);
app.use('/paises', paisesRoutes);
app.use('/horarios', horariosRoutes);
app.use('/especialidades', especialidadesRoutes);
app.use('/consultorios', consultoriosRoutes);
app.use('/personas', personasRoutes);
app.use('/usuarios', usuariosRoutes);
app.use('/estadisticas', estadisticasRoutes);
app.use('/perfil', perfilRoutes);

app.use((req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));
app.use(manejarErrores);

crearBaseSiFalta()
  .then(() => sequelize.authenticate())
  .then(async () => {
    console.log('Conectado a PostgreSQL');

    // Crea las tablas que falten a partir de los modelos.
    // (Sin "alter": así no se duplican índices y no se tocan tablas con datos.
    //  Si cambiás un modelo, ejecutá "npm run db:reset" para recrear todo.)
    await sequelize.sync();
    console.log('Tablas sincronizadas');

    await seedInicial();

    app.listen(PORT, () => {
      console.log(`Servidor escuchando en puerto ${PORT}`);
    });
  })
  .catch((error) => {
    const codigo = error.original?.code || error.parent?.code || error.code;
    console.error('Error al conectar con PostgreSQL:', MENSAJES_CONEXION[codigo] || error.message);
  });
