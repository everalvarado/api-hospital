// /usuarios
const { Router } = require('express');
const { verificarToken: token, permitirRol: rol } = require('../middlewares/auth');
const { ah } = require('../middlewares/errores');
const c = require('../controllers/usuarioController');

const router = Router();
router.use(token, rol('admin'));
router.get('/roles', ah(c.roles));
router.patch('/:id/estado', ah(c.cambiarEstado));
router.patch('/:id/contrasena', ah(c.cambiarContrasena));
module.exports = router;
