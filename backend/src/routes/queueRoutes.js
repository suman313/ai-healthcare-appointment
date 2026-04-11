const router = require('express').Router();
const auth = require('../middlewares/authMiddleware');
const pool = require('../config/db');

// PUBLIC — display screen (TV in waiting room)
router.get('/display/:clinicId', async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const result = await pool.query(
      `SELECT a.id, a.queue_number, a.checked_in_at, a.called_at, a.status,
              p.name AS patient_name,
              d.name AS doctor_name
       FROM appointments a
       JOIN patients p ON p.id = a.patient_id
       JOIN doctors d ON d.id = a.doctor_id
       WHERE a.clinic_id = $1
         AND DATE(a.appointment_time) = $2
         AND a.checked_in_at IS NOT NULL
         AND a.status NOT IN ('cancelled', 'no_show')
       ORDER BY a.queue_number ASC`,
      [req.params.clinicId, today]
    );

    const now_serving = result.rows.filter((r) => r.called_at && r.status !== 'completed');
    const waiting = result.rows.filter((r) => !r.called_at && r.status === 'booked');
    const completed = result.rows.filter((r) => r.status === 'completed');

    res.json({ now_serving, waiting, completed });
  } catch (err) { next(err); }
});

// PROTECTED — receptionist actions
router.use(auth);

// Check in a patient — assign queue number
router.post('/checkin/:appointmentId', async (req, res, next) => {
  try {
    // Get next queue number for today
    const countResult = await pool.query(
      `SELECT COALESCE(MAX(queue_number), 0) + 1 AS next_number
       FROM appointments
       WHERE clinic_id = $1 AND DATE(appointment_time) = CURRENT_DATE AND checked_in_at IS NOT NULL`,
      [req.user.clinic_id]
    );
    const queueNumber = countResult.rows[0].next_number;

    const result = await pool.query(
      `UPDATE appointments
       SET queue_number = $1, checked_in_at = NOW()
       WHERE id = $2 AND clinic_id = $3
       RETURNING *`,
      [queueNumber, req.params.appointmentId, req.user.clinic_id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Appointment not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

// Call a patient — show on display as "Now Serving"
router.post('/call/:appointmentId', async (req, res, next) => {
  try {
    const result = await pool.query(
      `UPDATE appointments SET called_at = NOW()
       WHERE id = $1 AND clinic_id = $2
       RETURNING *`,
      [req.params.appointmentId, req.user.clinic_id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Appointment not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

module.exports = router;
