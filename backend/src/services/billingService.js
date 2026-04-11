const pool = require('../config/db');

async function getBillingList(clinicId) {
  const result = await pool.query(
    `SELECT b.*, p.name AS patient_name, a.appointment_time
     FROM billing b
     JOIN patients p ON p.id = b.patient_id
     LEFT JOIN appointments a ON a.id = b.appointment_id
     WHERE b.clinic_id = $1
     ORDER BY b.created_at DESC`,
    [clinicId]
  );
  return result.rows;
}

async function getBillingStats(clinicId) {
  const result = await pool.query(
    `SELECT
       COUNT(*) AS total_invoices,
       SUM(amount) AS total_billed,
       SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) AS total_paid,
       SUM(CASE WHEN status = 'unpaid' THEN amount ELSE 0 END) AS total_outstanding,
       SUM(CASE WHEN status = 'paid' AND DATE_TRUNC('month', paid_at) = DATE_TRUNC('month', NOW()) THEN amount ELSE 0 END) AS revenue_this_month
     FROM billing
     WHERE clinic_id = $1`,
    [clinicId]
  );
  return result.rows[0];
}

async function createBilling(clinicId, { appointment_id, patient_id, amount, status, payment_method, notes }) {
  const result = await pool.query(
    `INSERT INTO billing (clinic_id, appointment_id, patient_id, amount, status, payment_method, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [clinicId, appointment_id || null, patient_id, amount, status || 'unpaid', payment_method, notes]
  );
  return result.rows[0];
}

async function updateBilling(clinicId, id, { amount, status, payment_method, notes }) {
  const paidAt = status === 'paid' ? new Date() : null;
  const result = await pool.query(
    `UPDATE billing
     SET amount=$3, status=$4, payment_method=$5, notes=$6, paid_at=COALESCE($7, paid_at)
     WHERE clinic_id=$1 AND id=$2
     RETURNING *`,
    [clinicId, id, amount, status, payment_method, notes, paidAt]
  );
  if (!result.rows[0]) throw Object.assign(new Error('Billing record not found'), { status: 404 });
  return result.rows[0];
}

async function getMonthlyRevenue(clinicId) {
  const result = await pool.query(
    `SELECT
       TO_CHAR(DATE_TRUNC('month', paid_at), 'Mon YYYY') AS month,
       DATE_TRUNC('month', paid_at) AS month_date,
       SUM(amount) AS revenue
     FROM billing
     WHERE clinic_id = $1 AND status = 'paid' AND paid_at >= NOW() - INTERVAL '6 months'
     GROUP BY DATE_TRUNC('month', paid_at)
     ORDER BY month_date ASC`,
    [clinicId]
  );
  return result.rows;
}

module.exports = { getBillingList, getBillingStats, createBilling, updateBilling, getMonthlyRevenue };
