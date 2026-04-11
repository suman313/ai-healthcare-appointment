const router = require('express').Router();
const pool = require('../config/db');
const { sendAppointmentConfirmation, sendCancellationNotice } = require('../services/emailService');
const { sendAppointmentSmsConfirmation, sendAppointmentSmsCancellation } = require('../services/smsService');

// GET /api/manage/:token — get appointment details by token
router.get('/:token', async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT a.*,
              p.name AS patient_name, p.email AS patient_email, p.phone AS patient_phone,
              d.name AS doctor_name, d.specialization,
              c.name AS clinic_name, c.phone AS clinic_phone
       FROM appointments a
       JOIN patients p ON p.id = a.patient_id
       JOIN doctors d ON d.id = a.doctor_id
       JOIN clinics c ON c.id = a.clinic_id
       WHERE a.manage_token = $1`,
      [req.params.token]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Appointment not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

// POST /api/manage/:token/cancel
router.post('/:token/cancel', async (req, res, next) => {
  try {
    const appt = await pool.query(
      `SELECT a.*, p.name AS patient_name, p.email AS patient_email, p.phone AS patient_phone,
              d.name AS doctor_name, c.name AS clinic_name, c.id AS clinic_id
       FROM appointments a
       JOIN patients p ON p.id = a.patient_id
       JOIN doctors d ON d.id = a.doctor_id
       JOIN clinics c ON c.id = a.clinic_id
       WHERE a.manage_token = $1`,
      [req.params.token]
    );
    if (!appt.rows.length) return res.status(404).json({ error: 'Appointment not found' });
    const a = appt.rows[0];

    if (a.status === 'cancelled') return res.status(400).json({ error: 'Already cancelled' });
    if (a.status === 'completed') return res.status(400).json({ error: 'Completed appointments cannot be cancelled' });

    await pool.query(`UPDATE appointments SET status = 'cancelled' WHERE id = $1`, [a.id]);

    const patient = { id: a.patient_id, name: a.patient_name, email: a.patient_email, phone: a.patient_phone };
    const doctor = { name: a.doctor_name };
    const clinic = { name: a.clinic_name };

    sendCancellationNotice({ patient, doctor, appointment: a, clinic }).catch(() => {});
    sendAppointmentSmsCancellation({ patient, doctor, clinic, clinicId: a.clinic_id }).catch(() => {});

    res.json({ message: 'Appointment cancelled successfully' });
  } catch (err) { next(err); }
});

// GET /api/manage/:token/slots?date=YYYY-MM-DD — available slots for rescheduling
router.get('/:token/slots', async (req, res, next) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: 'date is required' });

    const appt = await pool.query(
      `SELECT a.doctor_id, a.clinic_id FROM appointments a WHERE a.manage_token = $1`,
      [req.params.token]
    );
    if (!appt.rows.length) return res.status(404).json({ error: 'Appointment not found' });

    const { doctor_id, clinic_id } = appt.rows[0];
    const dayOfWeek = new Date(date).getDay();

    const availResult = await pool.query(
      `SELECT da.* FROM doctor_availability da WHERE da.doctor_id = $1 AND da.day_of_week = $2`,
      [doctor_id, dayOfWeek]
    );
    if (!availResult.rows.length) return res.json({ slots: [] });

    const bookedResult = await pool.query(
      `SELECT to_char(appointment_time, 'HH24:MI') AS slot_time
       FROM appointments
       WHERE doctor_id = $1 AND DATE(appointment_time) = $2 AND status NOT IN ('cancelled', 'no_show')`,
      [doctor_id, date]
    );
    const booked = new Set(bookedResult.rows.map((r) => r.slot_time));

    const slots = [];
    for (const avail of availResult.rows) {
      const [sh, sm] = avail.start_time.slice(0, 5).split(':').map(Number);
      const [eh, em] = avail.end_time.slice(0, 5).split(':').map(Number);
      let cur = sh * 60 + sm;
      const end = eh * 60 + em;
      while (cur + avail.slot_duration <= end) {
        const h = Math.floor(cur / 60).toString().padStart(2, '0');
        const m = (cur % 60).toString().padStart(2, '0');
        const slot = `${h}:${m}`;
        if (!booked.has(slot)) slots.push(slot);
        cur += avail.slot_duration;
      }
    }
    res.json({ slots });
  } catch (err) { next(err); }
});

// POST /api/manage/:token/reschedule
router.post('/:token/reschedule', async (req, res, next) => {
  try {
    const { new_time } = req.body;
    if (!new_time) return res.status(400).json({ error: 'new_time is required' });

    const appt = await pool.query(
      `SELECT a.*, p.name AS patient_name, p.email AS patient_email, p.phone AS patient_phone,
              d.name AS doctor_name, d.specialization, c.name AS clinic_name, c.id AS clinic_id
       FROM appointments a
       JOIN patients p ON p.id = a.patient_id
       JOIN doctors d ON d.id = a.doctor_id
       JOIN clinics c ON c.id = a.clinic_id
       WHERE a.manage_token = $1`,
      [req.params.token]
    );
    if (!appt.rows.length) return res.status(404).json({ error: 'Appointment not found' });
    const a = appt.rows[0];

    if (a.status === 'cancelled') return res.status(400).json({ error: 'Cannot reschedule a cancelled appointment' });
    if (a.status === 'completed') return res.status(400).json({ error: 'Cannot reschedule a completed appointment' });

    // Check new slot not already taken
    const conflict = await pool.query(
      `SELECT id FROM appointments WHERE doctor_id = $1 AND appointment_time = $2 AND status NOT IN ('cancelled','no_show') AND id != $3`,
      [a.doctor_id, new_time, a.id]
    );
    if (conflict.rows.length) return res.status(409).json({ error: 'That slot is already booked' });

    const updated = await pool.query(
      `UPDATE appointments SET appointment_time = $1, status = 'booked' WHERE id = $2 RETURNING *`,
      [new_time, a.id]
    );

    const patient = { id: a.patient_id, name: a.patient_name, email: a.patient_email, phone: a.patient_phone };
    const doctor = { name: a.doctor_name, specialization: a.specialization };
    const clinic = { name: a.clinic_name };
    const appointment = updated.rows[0];

    sendAppointmentConfirmation({ patient, doctor, appointment, clinic }).catch(() => {});
    sendAppointmentSmsConfirmation({ patient, doctor, appointment, clinic, clinicId: a.clinic_id }).catch(() => {});

    res.json({ message: 'Appointment rescheduled successfully', appointment });
  } catch (err) { next(err); }
});

module.exports = router;
