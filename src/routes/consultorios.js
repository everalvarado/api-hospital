// /consultorios
const { Router } = require('express');
const { verificarToken: token, permitirRol: rol } = require('../middlewares/auth');
const { ah } = require('../middlewares/errores');
const c = require('../controllers/consultorioController');

const router = Router();
router.get('/', token, ah(c.listar));
router.post('/', token, rol('admin'), ah(c.crear));
router.delete('/:id', token, rol('admin'), ah(c.eliminar));
module.exports = router;
