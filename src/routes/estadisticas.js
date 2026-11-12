// /estadisticas
const { Router } = require('express');
const { verificarToken: token, permitirRol: rol } = require('../middlewares/auth');
const { ah } = require('../middlewares/errores');
const c = require('../controllers/estadisticaController');

const router = Router();
router.get('/resumen', token, rol('admin'), ah(c.resumen));
module.exports = router;
