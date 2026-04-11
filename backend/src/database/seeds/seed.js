const pool = require('../../config/db');
const bcrypt = require('bcrypt');

async function seed() {
  const client = await pool.connect();
  try {
    // Seed a demo clinic
    const clinicResult = await client.query(`
      INSERT INTO clinics (name, address, phone, email)
      VALUES ('Demo Clinic', '123 Health Street', '555-0100', 'admin@democlinic.com')
      ON CONFLICT DO NOTHING
      RETURNING id
    `);

    const clinicId = clinicResult.rows[0]?.id;
    if (!clinicId) {
      console.log('Seed data already exists, skipping.');
      return;
    }

    const passwordHash = await bcrypt.hash('password123', 10);

    // Seed admin user
    await client.query(`
      INSERT INTO users (clinic_id, name, email, password_hash, role)
      VALUES ($1, 'Admin User', 'admin@democlinic.com', $2, 'admin')
    `, [clinicId, passwordHash]);

    // Seed a demo doctor
    await client.query(`
      INSERT INTO doctors (clinic_id, name, specialization, phone, email)
      VALUES ($1, 'Dr. Jane Smith', 'General Physician', '555-0101', 'jane.smith@democlinic.com')
    `, [clinicId]);

    console.log('Seed completed successfully.');
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
