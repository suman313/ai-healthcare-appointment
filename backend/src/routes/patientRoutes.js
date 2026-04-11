const router = require('express').Router();
const auth = require('../middlewares/authMiddleware');
const { verifyToken } = require('../utils/jwt');
const patientController = require('../controllers/patientController');

// Populates req.user if a valid token is present, but does not block unauthenticated requests.
// Used for routes that serve both public booking and authenticated staff.
function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    try { req.user = verifyToken(header.split(' ')[1]); } catch {}
  }
  next();
}

// Public + authenticated: public booking sends clinic_id in body; staff rely on req.user.clinic_id
router.post('/', optionalAuth, patientController.createPatient);

// Protected routes (clinic staff only)
router.use(auth);
router.get('/', patientController.getPatients);

module.exports = router;
