const pool = require('../config/db');
const { hashPassword } = require('../utils/hashPassword');

async function getUsers(clinicId) {
  const result = await pool.query(
    `SELECT id, name, email, role, doctor_id, created_at FROM users WHERE clinic_id = $1 ORDER BY created_at DESC`,
    [clinicId]
  );
  return result.rows;
}

async function createUser(clinicId, { name, email, password, role, specialization, phone, doctor_id }) {
  const allowed = ['doctor', 'receptionist'];
  if (!allowed.includes(role)) throw Object.assign(new Error('Invalid role'), { status: 400 });

  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length) throw Object.assign(new Error('Email already in use'), { status: 409 });

  const passwordHash = await hashPassword(password);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    let resolvedDoctorId = null;
    if (role === 'doctor') {
      if (doctor_id) {
        // Link to existing doctor profile — verify it belongs to this clinic
        const check = await client.query(
          'SELECT id FROM doctors WHERE id = $1 AND clinic_id = $2',
          [doctor_id, clinicId]
        );
        if (!check.rows.length) throw Object.assign(new Error('Doctor profile not found'), { status: 404 });
        resolvedDoctorId = doctor_id;
      } else {
        // Create a new doctor profile automatically
        const doctorResult = await client.query(
          `INSERT INTO doctors (clinic_id, name, specialization, phone, email)
           VALUES ($1, $2, $3, $4, $5) RETURNING id`,
          [clinicId, name, specialization || 'General Physician', phone || null, email]
        );
        resolvedDoctorId = doctorResult.rows[0].id;
      }
    }

    const result = await client.query(
      `INSERT INTO users (clinic_id, name, email, password_hash, role, doctor_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, email, role, doctor_id, created_at`,
      [clinicId, name, email, passwordHash, role, resolvedDoctorId]
    );

    await client.query('COMMIT');
    return result.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function updateUser(clinicId, id, { name, email, role, doctor_id }) {
  const result = await pool.query(
    `UPDATE users SET name=$3, email=$4, role=$5, doctor_id=$6
     WHERE clinic_id=$1 AND id=$2
     RETURNING id, name, email, role, doctor_id, created_at`,
    [clinicId, id, name, email, role, doctor_id || null]
  );
  if (!result.rows[0]) throw Object.assign(new Error('User not found'), { status: 404 });
  return result.rows[0];
}

async function deleteUser(clinicId, id) {
  await pool.query('DELETE FROM users WHERE clinic_id=$1 AND id=$2', [clinicId, id]);
}

async function resetPassword(clinicId, id, { password }) {
  const passwordHash = await hashPassword(password);
  await pool.query('UPDATE users SET password_hash=$3 WHERE clinic_id=$1 AND id=$2', [clinicId, id, passwordHash]);
}

module.exports = { getUsers, createUser, updateUser, deleteUser, resetPassword };
