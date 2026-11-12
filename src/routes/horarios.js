// /horarios  -> horarios de atención de los médicos
const { Router } = require('express');
const { verificarToken: token, permitirRol: rol } = require('../middlewares/auth');
const { ah } = require('../middlewares/errores');
const c = require('../controllers/horarioController');

const router = Router();
router.get('/', ah(c.listar));                                        // público ?id_medico=
router.get('/disponibles', token, ah(c.disponibles));                 // ?id_medico=&fecha=
router.post('/', token, rol('admin'), ah(c.crear));
router.delete('/:id', token, rol('admin'), ah(c.eliminar));
module.exports = router;
