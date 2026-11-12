// /perfil  -> datos propios del usuario logueado
const { Router } = require('express');
const { verificarToken: token, permitirRol: rol } = require('../middlewares/auth');
const { ah } = require('../middlewares/errores');
const c = require('../controllers/perfilController');

const router = Router();
router.get('/', token, ah(c.obtener));
router.put('/', token, ah(c.editar));
module.exports = router;
