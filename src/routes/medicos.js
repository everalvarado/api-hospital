// /medicos
const { Router } = require('express');
const { verificarToken: token, permitirRol: rol } = require('../middlewares/auth');
const { ah } = require('../middlewares/errores');
const c = require('../controllers/medicoController');

const router = Router();
router.get('/', ah(c.listar));                                        // público ?especialidad=
router.post('/login', ah(c.login));                                   // login de médicos
router.get('/:id', ah(c.obtener));                                    // público: especialidades y horarios
router.get('/:id/turnos', token, rol('medico', 'admin', 'enfermero'), ah(c.turnos));
router.get('/:id/pacientes/:idPaciente', token, rol('medico', 'admin'), ah(c.fichaPaciente));
router.post('/:id/especialidades', token, rol('admin'), ah(c.agregarEspecialidad));
router.delete('/:id/especialidades/:idEspecialidad', token, rol('admin'), ah(c.quitarEspecialidad));
module.exports = router;
