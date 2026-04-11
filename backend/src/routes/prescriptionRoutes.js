const router = require('express').Router();
const authMiddleware = require('../middlewares/authMiddleware');
const requireRole = require('../middlewares/roleMiddleware');
const ctrl = require('../controllers/prescriptionController');

router.use(authMiddleware);

router.get('/patient/:patientId', ctrl.getByPatient);
router.get('/doctor/:doctorId', requireRole('doctor', 'admin'), ctrl.getByDoctor);
router.get('/:id', ctrl.getOne);
router.post('/', requireRole('doctor'), ctrl.create);
router.put('/:id', requireRole('doctor'), ctrl.update);

module.exports = router;
