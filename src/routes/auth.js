// /auth  -> login y registro
const { Router } = require('express');
const { verificarToken: token, permitirRol: rol } = require('../middlewares/auth');
const { ah } = require('../middlewares/errores');
const c = require('../controllers/authController');

const router = Router();
router.post('/login', ah(c.login));                         // { usuario, contraseña, rol? }
router.post('/registro-paciente', ah(c.registroPaciente));  // alta de pacientes
router.get('/me', token, c.yo);                             // usuario del token
module.exports = router;
