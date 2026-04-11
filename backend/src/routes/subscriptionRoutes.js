const router = require('express').Router();
const auth = require('../middlewares/authMiddleware');
const { getPlans, getClinicSubscription, getClinicUsageThisMonth, upgradePlan } = require('../services/subscriptionService');

// Public — show plans to anyone (for landing page / register page)
router.get('/plans', async (req, res, next) => {
  try {
    res.json(await getPlans());
  } catch (err) {
    next(err);
  }
});

// Protected — clinic-specific
router.use(auth);

router.get('/current', async (req, res, next) => {
  try {
    const [subscription, usage] = await Promise.all([
      getClinicSubscription(req.user.clinic_id),
      getClinicUsageThisMonth(req.user.clinic_id),
    ]);
    res.json({ subscription, usage });
  } catch (err) {
    next(err);
  }
});

router.post('/upgrade', async (req, res, next) => {
  try {
    const { plan_id } = req.body;
    if (!plan_id) return res.status(400).json({ error: 'plan_id is required' });
    const result = await upgradePlan(req.user.clinic_id, plan_id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
