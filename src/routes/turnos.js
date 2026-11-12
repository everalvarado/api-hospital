// /turnos
const { Router } = require('express');
const { verificarToken: token, permitirRol: rol } = require('../middlewares/auth');
const { ah } = require('../middlewares/errores');
const c = require('../controllers/turnoController');

const router = Router();
router.use(token);
router.get('/', ah(c.listar));                                        // según el rol
router.get('/prioridad', rol('admin'), ah(c.prioridad));              // control de la Regla 2
router.post('/', rol('paciente'), ah(c.crear));                       // solicitar turno
router.patch('/:id/aprobar', rol('enfermero'), ah(c.aprobar));
router.patch('/:id/cancelar', rol('paciente', 'enfermero', 'admin'), ah(c.cancelar));
router.patch('/:id/atender', rol('medico'), ah(c.atender));
module.exports = router;
