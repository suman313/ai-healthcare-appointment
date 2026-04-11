const pool = require('../config/db');

async function getPrescriptionsByPatient(clinicId, patientId) {
  const result = await pool.query(
    `SELECT pr.*, d.name AS doctor_name
     FROM prescriptions pr
     JOIN doctors d ON d.id = pr.doctor_id
     WHERE pr.clinic_id = $1 AND pr.patient_id = $2
     ORDER BY pr.issued_at DESC`,
    [clinicId, patientId]
  );
  return result.rows;
}

async function getPrescriptionsByDoctor(clinicId, doctorId) {
  const result = await pool.query(
    `SELECT pr.*, p.name AS patient_name
     FROM prescriptions pr
     JOIN patients p ON p.id = pr.patient_id
     WHERE pr.clinic_id = $1 AND pr.doctor_id = $2
     ORDER BY pr.issued_at DESC`,
    [clinicId, doctorId]
  );
  return result.rows;
}

async function getPrescription(clinicId, id) {
  const result = await pool.query(
    `SELECT pr.*, d.name AS doctor_name, d.specialization,
            p.name AS patient_name, p.date_of_birth, p.phone AS patient_phone,
            c.name AS clinic_name, c.address AS clinic_address, c.phone AS clinic_phone
     FROM prescriptions pr
     JOIN doctors d ON d.id = pr.doctor_id
     JOIN patients p ON p.id = pr.patient_id
     JOIN clinics c ON c.id = pr.clinic_id
     WHERE pr.clinic_id = $1 AND pr.id = $2`,
    [clinicId, id]
  );
  if (!result.rows[0]) throw Object.assign(new Error('Prescription not found'), { status: 404 });
  return result.rows[0];
}

async function createPrescription(clinicId, { medical_record_id, patient_id, doctor_id, medications, notes }) {
  const result = await pool.query(
    `INSERT INTO prescriptions (clinic_id, medical_record_id, patient_id, doctor_id, medications, notes)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [clinicId, medical_record_id || null, patient_id, doctor_id, JSON.stringify(medications || []), notes]
  );
  return result.rows[0];
}

async function updatePrescription(clinicId, id, { medications, notes }) {
  const result = await pool.query(
    `UPDATE prescriptions SET medications=$3, notes=$4 WHERE clinic_id=$1 AND id=$2 RETURNING *`,
    [clinicId, id, JSON.stringify(medications || []), notes]
  );
  if (!result.rows[0]) throw Object.assign(new Error('Prescription not found'), { status: 404 });
  return result.rows[0];
}

module.exports = { getPrescriptionsByPatient, getPrescriptionsByDoctor, getPrescription, createPrescription, updatePrescription };
