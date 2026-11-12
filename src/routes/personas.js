// /personas
const { Router } = require('express');
const { verificarToken: token, permitirRol: rol } = require('../middlewares/auth');
const { ah } = require('../middlewares/errores');
const c = require('../controllers/personaController');

const router = Router();
router.use(token);
router.get('/', rol('admin', 'enfermero'), ah(c.listar));             // enfermero: solo pacientes
router.post('/', rol('admin'), ah(c.crear));
router.put('/:id', rol('admin'), ah(c.editar));
router.put('/:id/roles', rol('admin'), ah(c.cambiarRoles));
module.exports = router;
