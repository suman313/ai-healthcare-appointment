const pool = require('../config/db');
const { sendAppointmentConfirmation, sendCancellationNotice } = require('./emailService');
const { sendAppointmentSmsConfirmation, sendAppointmentSmsCancellation } = require('./smsService');

async function getAppointments(clinicId) {
  const result = await pool.query(
    `SELECT a.*, d.name AS doctor_name, p.name AS patient_name
     FROM appointments a
     JOIN doctors d ON d.id = a.doctor_id
     JOIN patients p ON p.id = a.patient_id
     WHERE a.clinic_id = $1
     ORDER BY a.appointment_time DESC`,
    [clinicId]
  );
  return result.rows;
}

async function createAppointment(clinicId, { doctor_id, patient_id, appointment_time, symptoms, clinic_id: bodyClinicId }) {
  const resolvedClinicId = clinicId || bodyClinicId;
  if (!resolvedClinicId) throw Object.assign(new Error('clinic_id is required'), { status: 400 });
  clinicId = resolvedClinicId;

  // Verify doctor belongs to this clinic
  const doctorCheck = await pool.query('SELECT id FROM doctors WHERE id = $1 AND clinic_id = $2', [doctor_id, clinicId]);
  if (doctorCheck.rows.length === 0) throw Object.assign(new Error('Doctor not found'), { status: 404 });

  const patientCheck = await pool.query('SELECT id FROM patients WHERE id = $1 AND clinic_id = $2', [patient_id, clinicId]);
  if (patientCheck.rows.length === 0) throw Object.assign(new Error('Patient not found'), { status: 404 });

  // Check for slot conflict
  const conflict = await pool.query(
    `SELECT id FROM appointments
     WHERE doctor_id = $1 AND appointment_time = $2 AND status NOT IN ('cancelled', 'no_show')`,
    [doctor_id, appointment_time]
  );
  if (conflict.rows.length > 0) throw Object.assign(new Error('Time slot already booked'), { status: 409 });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const apptResult = await client.query(
      `INSERT INTO appointments (clinic_id, doctor_id, patient_id, appointment_time, symptoms)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [clinicId, doctor_id, patient_id, appointment_time, symptoms || null]
    );
    const appointment = apptResult.rows[0];

    // Schedule a reminder 24h before
    const reminderTime = new Date(new Date(appointment_time).getTime() - 24 * 60 * 60 * 1000);
    await client.query(
      'INSERT INTO appointment_reminders (appointment_id, reminder_time) VALUES ($1, $2)',
      [appointment.id, reminderTime]
    );

    await client.query('COMMIT');

    // Send confirmation email (non-blocking)
    const [patientRow, doctorRow, clinicRow] = await Promise.all([
      pool.query('SELECT * FROM patients WHERE id = $1', [patient_id]),
      pool.query('SELECT * FROM doctors WHERE id = $1', [doctor_id]),
      pool.query('SELECT * FROM clinics WHERE id = $1', [clinicId]),
    ]);
    const patient = patientRow.rows[0];
    const doctor = doctorRow.rows[0];
    const clinic = clinicRow.rows[0];

    sendAppointmentConfirmation({ patient, doctor, appointment, clinic }).catch(() => {});
    sendAppointmentSmsConfirmation({ patient, doctor, appointment, clinic, clinicId }).catch(() => {});

    return appointment;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function updateAppointment(clinicId, appointmentId, { status, appointment_time, symptoms }) {
  const result = await pool.query(
    `UPDATE appointments
     SET status = COALESCE($1, status),
         appointment_time = COALESCE($2, appointment_time),
         symptoms = COALESCE($3, symptoms)
     WHERE id = $4 AND clinic_id = $5 RETURNING *`,
    [status, appointment_time || null, symptoms, appointmentId, clinicId]
  );
  if (result.rows.length === 0) throw Object.assign(new Error('Appointment not found'), { status: 404 });
  const appointment = result.rows[0];

  // Send cancellation email if status changed to cancelled
  if (status === 'cancelled') {
    const [patientRow, doctorRow, clinicRow] = await Promise.all([
      pool.query('SELECT * FROM patients WHERE id = $1', [appointment.patient_id]),
      pool.query('SELECT * FROM doctors WHERE id = $1', [appointment.doctor_id]),
      pool.query('SELECT * FROM clinics WHERE id = $1', [clinicId]),
    ]);
    const patient = patientRow.rows[0];
    const doctor = doctorRow.rows[0];
    const clinic = clinicRow.rows[0];

    sendCancellationNotice({ patient, doctor, appointment, clinic }).catch(() => {});
    sendAppointmentSmsCancellation({ patient, doctor, clinic, clinicId }).catch(() => {});
  }

  return appointment;
}

async function deleteAppointment(clinicId, appointmentId) {
  const result = await pool.query(
    'DELETE FROM appointments WHERE id = $1 AND clinic_id = $2 RETURNING id',
    [appointmentId, clinicId]
  );
  if (result.rows.length === 0) throw Object.assign(new Error('Appointment not found'), { status: 404 });
}

module.exports = { getAppointments, createAppointment, updateAppointment, deleteAppointment };
