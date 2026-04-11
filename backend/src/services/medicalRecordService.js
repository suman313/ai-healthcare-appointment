const pool = require('../config/db');

async function getRecordsByPatient(clinicId, patientId) {
  const result = await pool.query(
    `SELECT mr.*, d.name AS doctor_name
     FROM medical_records mr
     JOIN doctors d ON d.id = mr.doctor_id
     WHERE mr.clinic_id = $1 AND mr.patient_id = $2
     ORDER BY mr.visit_date DESC`,
    [clinicId, patientId]
  );
  return result.rows;
}

async function getRecordsByDoctor(clinicId, doctorId) {
  const result = await pool.query(
    `SELECT mr.*, p.name AS patient_name
     FROM medical_records mr
     JOIN patients p ON p.id = mr.patient_id
     WHERE mr.clinic_id = $1 AND mr.doctor_id = $2
     ORDER BY mr.visit_date DESC`,
    [clinicId, doctorId]
  );
  return result.rows;
}

async function getRecord(clinicId, id) {
  const result = await pool.query(
    `SELECT mr.*, d.name AS doctor_name, p.name AS patient_name
     FROM medical_records mr
     JOIN doctors d ON d.id = mr.doctor_id
     JOIN patients p ON p.id = mr.patient_id
     WHERE mr.clinic_id = $1 AND mr.id = $2`,
    [clinicId, id]
  );
  if (!result.rows[0]) throw Object.assign(new Error('Record not found'), { status: 404 });
  return result.rows[0];
}

async function createRecord(clinicId, { appointment_id, patient_id, doctor_id, visit_date, subjective, objective, assessment, plan, diagnosis, notes }) {
  const result = await pool.query(
    `INSERT INTO medical_records
       (clinic_id, appointment_id, patient_id, doctor_id, visit_date, subjective, objective, assessment, plan, diagnosis, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING *`,
    [clinicId, appointment_id || null, patient_id, doctor_id, visit_date || new Date(), subjective, objective, assessment, plan, diagnosis, notes]
  );
  return result.rows[0];
}

async function updateRecord(clinicId, id, { subjective, objective, assessment, plan, diagnosis, notes }) {
  const result = await pool.query(
    `UPDATE medical_records
     SET subjective=$3, objective=$4, assessment=$5, plan=$6, diagnosis=$7, notes=$8
     WHERE clinic_id=$1 AND id=$2
     RETURNING *`,
    [clinicId, id, subjective, objective, assessment, plan, diagnosis, notes]
  );
  if (!result.rows[0]) throw Object.assign(new Error('Record not found'), { status: 404 });
  return result.rows[0];
}

module.exports = { getRecordsByPatient, getRecordsByDoctor, getRecord, createRecord, updateRecord };
