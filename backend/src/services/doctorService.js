const pool = require('../config/db');

async function getDoctors(clinicId) {
  if (!clinicId) return [];
  const result = await pool.query(
    'SELECT * FROM doctors WHERE clinic_id = $1 ORDER BY created_at DESC',
    [clinicId]
  );
  return result.rows;
}

async function createDoctor(clinicId, { name, specialization, phone, email }) {
  const result = await pool.query(
    'INSERT INTO doctors (clinic_id, name, specialization, phone, email) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [clinicId, name, specialization, phone, email]
  );
  return result.rows[0];
}

async function updateDoctor(clinicId, doctorId, { name, specialization, phone, email }) {
  const result = await pool.query(
    `UPDATE doctors SET name = COALESCE($1, name), specialization = COALESCE($2, specialization),
     phone = COALESCE($3, phone), email = COALESCE($4, email)
     WHERE id = $5 AND clinic_id = $6 RETURNING *`,
    [name, specialization, phone, email, doctorId, clinicId]
  );
  if (result.rows.length === 0) throw Object.assign(new Error('Doctor not found'), { status: 404 });
  return result.rows[0];
}

async function deleteDoctor(clinicId, doctorId) {
  const result = await pool.query(
    'DELETE FROM doctors WHERE id = $1 AND clinic_id = $2 RETURNING id',
    [doctorId, clinicId]
  );
  if (result.rows.length === 0) throw Object.assign(new Error('Doctor not found'), { status: 404 });
}

async function getAvailability(doctorId, clinicId) {
  const result = await pool.query(
    `SELECT da.* FROM doctor_availability da
     JOIN doctors d ON d.id = da.doctor_id
     WHERE da.doctor_id = $1 AND d.clinic_id = $2`,
    [doctorId, clinicId]
  );
  return result.rows;
}

async function setAvailability(doctorId, clinicId, slots) {
  const doctorCheck = await pool.query(
    'SELECT id FROM doctors WHERE id = $1 AND clinic_id = $2',
    [doctorId, clinicId]
  );
  if (doctorCheck.rows.length === 0) throw Object.assign(new Error('Doctor not found'), { status: 404 });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM doctor_availability WHERE doctor_id = $1', [doctorId]);

    for (const slot of slots) {
      await client.query(
        'INSERT INTO doctor_availability (doctor_id, day_of_week, start_time, end_time, slot_duration) VALUES ($1, $2, $3, $4, $5)',
        [doctorId, slot.day_of_week, slot.start_time, slot.end_time, slot.slot_duration || 15]
      );
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

function generateSlots(startTime, endTime, durationMinutes) {
  const slots = [];
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);

  let current = startH * 60 + startM;
  const end = endH * 60 + endM;

  while (current + durationMinutes <= end) {
    const h = Math.floor(current / 60).toString().padStart(2, '0');
    const m = (current % 60).toString().padStart(2, '0');
    slots.push(`${h}:${m}`);
    current += durationMinutes;
  }
  return slots;
}

async function getAvailableSlots(doctorId, clinicId, date) {
  const dayOfWeek = new Date(date).getDay();

  const availResult = clinicId
    ? await pool.query(
        `SELECT da.* FROM doctor_availability da
         JOIN doctors d ON d.id = da.doctor_id
         WHERE da.doctor_id = $1 AND d.clinic_id = $2 AND da.day_of_week = $3`,
        [doctorId, clinicId, dayOfWeek]
      )
    : await pool.query(
        `SELECT da.* FROM doctor_availability da
         WHERE da.doctor_id = $1 AND da.day_of_week = $2`,
        [doctorId, dayOfWeek]
      );

  if (availResult.rows.length === 0) return [];

  const bookedResult = await pool.query(
    `SELECT to_char(appointment_time, 'HH24:MI') AS slot_time
     FROM appointments
     WHERE doctor_id = $1
     AND DATE(appointment_time) = $2
     AND status NOT IN ('cancelled', 'no_show')`,
    [doctorId, date]
  );
  const bookedTimes = new Set(bookedResult.rows.map((r) => r.slot_time));

  const allSlots = [];
  for (const avail of availResult.rows) {
    const slots = generateSlots(
      avail.start_time.slice(0, 5),
      avail.end_time.slice(0, 5),
      avail.slot_duration
    );
    slots.forEach((s) => {
      if (!bookedTimes.has(s)) allSlots.push(s);
    });
  }

  return allSlots;
}

module.exports = { getDoctors, createDoctor, updateDoctor, deleteDoctor, getAvailability, setAvailability, getAvailableSlots };
