const pool = require('../config/db');

async function getPlans() {
  const result = await pool.query('SELECT * FROM subscription_plans ORDER BY price ASC');
  return result.rows;
}

async function getClinicSubscription(clinicId) {
  const result = await pool.query(
    `SELECT cs.*, sp.name AS plan_name, sp.price, sp.max_doctors,
            sp.max_appointments_per_month, sp.sms_enabled, sp.max_sms_per_month, sp.features
     FROM clinic_subscriptions cs
     JOIN subscription_plans sp ON sp.id = cs.plan_id
     WHERE cs.clinic_id = $1 AND cs.status = 'active'
     ORDER BY cs.created_at DESC LIMIT 1`,
    [clinicId]
  );
  return result.rows[0] || null;
}

async function getClinicUsageThisMonth(clinicId) {
  const [apptResult, smsResult] = await Promise.all([
    pool.query(
      `SELECT COUNT(*) FROM appointments
       WHERE clinic_id = $1 AND created_at >= date_trunc('month', NOW())`,
      [clinicId]
    ),
    pool.query(
      `SELECT COUNT(*) FROM notifications n
       JOIN patients p ON p.id = n.patient_id
       WHERE p.clinic_id = $1 AND n.type LIKE 'sms_%'
         AND n.sent_at >= date_trunc('month', NOW())`,
      [clinicId]
    ),
  ]);
  return {
    appointments: parseInt(apptResult.rows[0].count, 10),
    sms: parseInt(smsResult.rows[0].count, 10),
  };
}

async function upgradePlan(clinicId, planId) {
  const plan = await pool.query('SELECT id FROM subscription_plans WHERE id = $1', [planId]);
  if (!plan.rows.length) throw Object.assign(new Error('Plan not found'), { status: 404 });

  // Cancel existing active subscriptions
  await pool.query(
    `UPDATE clinic_subscriptions SET status = 'cancelled' WHERE clinic_id = $1 AND status = 'active'`,
    [clinicId]
  );

  // Create new subscription
  const result = await pool.query(
    `INSERT INTO clinic_subscriptions (clinic_id, plan_id, status, expires_at)
     VALUES ($1, $2, 'active', NOW() + INTERVAL '30 days')
     RETURNING *`,
    [clinicId, planId]
  );
  return result.rows[0];
}

async function assignFreePlanOnRegister(clinicId, client) {
  const plan = await client.query(`SELECT id FROM subscription_plans WHERE name = 'Free' LIMIT 1`);
  if (plan.rows.length) {
    await client.query(
      `INSERT INTO clinic_subscriptions (clinic_id, plan_id, status) VALUES ($1, $2, 'active')`,
      [clinicId, plan.rows[0].id]
    );
  }
}

module.exports = { getPlans, getClinicSubscription, getClinicUsageThisMonth, upgradePlan, assignFreePlanOnRegister };
