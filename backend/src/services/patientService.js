const pool = require('../config/db');

async function getPatients(clinicId) {
  const result = await pool.query(
    'SELECT * FROM patients WHERE clinic_id = $1 ORDER BY created_at DESC',
    [clinicId]
  );
  return result.rows;
}

async function createPatient(clinicId, { name, phone, email, date_of_birth, clinic_id: bodyClinicId }) {
  const resolvedClinicId = clinicId || bodyClinicId;
  if (!resolvedClinicId) throw Object.assign(new Error('clinic_id is required'), { status: 400 });
  const result = await pool.query(
    'INSERT INTO patients (clinic_id, name, phone, email, date_of_birth) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [resolvedClinicId, name, phone, email, date_of_birth || null]
  );
  return result.rows[0];
}

module.exports = { getPatients, createPatient };
