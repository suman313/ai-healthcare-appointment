const router = require('express').Router();
const auth = require('../middlewares/authMiddleware');
const aiController = require('../controllers/aiController');

router.use(auth);

router.post('/symptom-check', aiController.symptomCheck);

module.exports = router;
