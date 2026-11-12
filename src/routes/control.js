// /control  -> controles de peso y talla
const { Router } = require('express');
const { verificarToken: token, permitirRol: rol } = require('../middlewares/auth');
const { ah } = require('../middlewares/errores');
const c = require('../controllers/controlController');

const router = Router();
router.use(token);
router.get('/', ah(c.listar));                                        // según el rol
router.post('/', rol('enfermero'), ah(c.crear));
router.patch('/:id/verificar', rol('enfermero'), ah(c.verificar));
module.exports = router;
