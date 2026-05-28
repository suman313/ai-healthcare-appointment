require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: 'postgres',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false }
});

pool.query('CREATE DATABASE healthcare_appointment', (err) => {
  if (err) console.error('Error:', err.message);
  else console.log('Database healthcare_appointment created!');
  pool.end();
});
