const pool = require('../config/db');
const { hashPassword, comparePassword } = require('../utils/hashPassword');
const { signToken } = require('../utils/jwt');
const { assignFreePlanOnRegister } = require('./subscriptionService');

async function registerClinic({ clinicName, address, phone, email, adminName, adminEmail, adminPassword }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const clinicResult = await client.query(
      'INSERT INTO clinics (name, address, phone, email) VALUES ($1, $2, $3, $4) RETURNING id',
      [clinicName, address, phone, email]
    );
    const clinicId = clinicResult.rows[0].id;

    const passwordHash = await hashPassword(adminPassword);
    const userResult = await client.query(
      'INSERT INTO users (clinic_id, name, email, password_hash, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role',
      [clinicId, adminName, adminEmail, passwordHash, 'admin']
    );

    await assignFreePlanOnRegister(clinicId, client);

    await client.query('COMMIT');

    const user = userResult.rows[0];
    const token = signToken({ id: user.id, clinic_id: clinicId, role: user.role });
    return { token, user: { ...user, clinic_id: clinicId } };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function login({ email, password }) {
  const result = await pool.query(
    'SELECT id, clinic_id, name, email, password_hash, role, doctor_id FROM users WHERE email = $1',
    [email]
  );

  const user = result.rows[0];
  if (!user) throw Object.assign(new Error('Invalid email or password'), { status: 401 });

  const valid = await comparePassword(password, user.password_hash);
  if (!valid) throw Object.assign(new Error('Invalid email or password'), { status: 401 });

  const token = signToken({ id: user.id, clinic_id: user.clinic_id, role: user.role, doctor_id: user.doctor_id });
  const { password_hash, ...safeUser } = user;
  return { token, user: safeUser };
}

module.exports = { registerClinic, login };
