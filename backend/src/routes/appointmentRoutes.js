const router = require('express').Router();
const auth = require('../middlewares/authMiddleware');
const optionalAuth = require('../middlewares/optionalAuth');
const appointmentController = require('../controllers/appointmentController');

// optionalAuth: sets req.user if token present (admin), allows clinic_id from body if not (public booking)
router.post('/', optionalAuth, appointmentController.createAppointment);

// Protected routes (clinic staff only)
router.use(auth);
router.get('/', appointmentController.getAppointments);
router.put('/:id', appointmentController.updateAppointment);
router.delete('/:id', appointmentController.deleteAppointment);

module.exports = router;
