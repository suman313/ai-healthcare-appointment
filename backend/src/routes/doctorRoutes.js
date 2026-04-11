const router = require('express').Router();
const auth = require('../middlewares/authMiddleware');
const optionalAuth = require('../middlewares/optionalAuth');
const doctorController = require('../controllers/doctorController');

// Public routes — optionalAuth sets req.user if token present, allows clinic_id from token or query param
router.get('/', optionalAuth, doctorController.getDoctors);
router.get('/:id/slots', optionalAuth, doctorController.getAvailableSlots);

// Protected routes (clinic staff only)
router.use(auth);
router.post('/', doctorController.createDoctor);
router.put('/:id', doctorController.updateDoctor);
router.delete('/:id', doctorController.deleteDoctor);

router.get('/:id/availability', doctorController.getAvailability);
router.post('/:id/availability', doctorController.setAvailability);

module.exports = router;
