const router = require('express').Router();
const authMiddleware = require('../middlewares/authMiddleware');
const requireRole = require('../middlewares/roleMiddleware');
const ctrl = require('../controllers/billingController');

router.use(authMiddleware);
router.use(requireRole('admin', 'receptionist'));

router.get('/', ctrl.getList);
router.get('/stats', ctrl.getStats);
router.get('/monthly-revenue', ctrl.getMonthlyRevenue);
router.post('/', ctrl.create);
router.put('/:id', ctrl.update);

module.exports = router;
