const router = require('express').Router();
const authController = require('../controllers/authController');

router.post('/register-clinic', authController.registerClinic);
router.post('/login', authController.login);

module.exports = router;
