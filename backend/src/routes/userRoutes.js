const router = require('express').Router();
const authMiddleware = require('../middlewares/authMiddleware');
const requireRole = require('../middlewares/roleMiddleware');
const ctrl = require('../controllers/userController');

router.use(authMiddleware);
router.use(requireRole('admin'));

router.get('/', ctrl.getUsers);
router.post('/', ctrl.createUser);
router.put('/:id', ctrl.updateUser);
router.delete('/:id', ctrl.deleteUser);
router.post('/:id/reset-password', ctrl.resetPassword);

module.exports = router;
