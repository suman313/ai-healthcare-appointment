const router = require('express').Router();
const auth = require('../middlewares/authMiddleware');
const pool = require('../config/db');

router.use(auth);

router.get('/', async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT n.*, p.name AS patient_name, p.email AS patient_email
       FROM notifications n
       LEFT JOIN patients p ON p.id = n.patient_id
       WHERE p.clinic_id = $1
       ORDER BY n.sent_at DESC
       LIMIT 100`,
      [req.user.clinic_id]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
