const pool = require('../config/db');

function normalizePhone(phone) {
  const normalized = phone.replace(/\D/g, '').replace(/^(91|0)/, '').slice(-10);
  return normalized.length === 10 ? normalized : null;
}

async function sendWhatsApp(phone, message) {
  try {
    const res = await fetch('https://www.fast2sms.com/dev/bulk', {
      method: 'POST',
      headers: {
        authorization: process.env.FAST2SMS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        route: 'wa',
        message,
        numbers: phone,
      }),
    });
    const data = await res.json();
    if (data.return === true) {
      console.log('[WhatsApp] Sent to:', phone);
      return true;
    }
    console.log('[WhatsApp] Failed:', data.message, '— will fallback to SMS');
    return false;
  } catch (err) {
    console.log('[WhatsApp] Error:', err.message, '— will fallback to SMS');
    return false;
  }
}

async function sendSms(phone, message) {
  if (!process.env.FAST2SMS_API_KEY) {
    console.log('[WhatsApp] Not configured — mock send to:', phone, '|', message);
    return false;
  }

  const normalized = normalizePhone(phone);
  if (!normalized) {
    console.log('[WhatsApp] Invalid phone number:', phone);
    return false;
  }

  return await sendWhatsApp(normalized, message);
}

async function getClinicSmsUsageThisMonth(clinicId) {
  const result = await pool.query(
    `SELECT COUNT(*) FROM notifications n
     JOIN patients p ON p.id = n.patient_id
     WHERE p.clinic_id = $1
       AND n.type LIKE 'sms_%'
       AND n.sent_at >= date_trunc('month', NOW())`,
    [clinicId]
  );
  return parseInt(result.rows[0].count, 10);
}

async function canSendSms(clinicId) {
  const result = await pool.query(
    `SELECT sp.sms_enabled, sp.max_sms_per_month
     FROM clinic_subscriptions cs
     JOIN subscription_plans sp ON sp.id = cs.plan_id
     WHERE cs.clinic_id = $1 AND cs.status = 'active'
     ORDER BY cs.created_at DESC LIMIT 1`,
    [clinicId]
  );
  if (!result.rows.length) return false;
  const { sms_enabled, max_sms_per_month } = result.rows[0];
  if (!sms_enabled) return false;
  if (max_sms_per_month === -1) return true; // unlimited
  const used = await getClinicSmsUsageThisMonth(clinicId);
  return used < max_sms_per_month;
}

async function logSmsNotification(patientId, type, message, status, channel = 'sms') {
  try {
    await pool.query(
      `INSERT INTO notifications (patient_id, type, message, status) VALUES ($1, $2, $3, $4)`,
      [patientId, `${channel}_${type}`, message, status]
    );
  } catch (err) {
    console.error('[Notify Log] Failed:', err.message);
  }
}

async function sendAppointmentSmsConfirmation({ patient, doctor, appointment, clinic, clinicId }) {
  const allowed = await canSendSms(clinicId);
  if (!allowed) return;

  if (!patient.phone) return;

  const date = new Date(appointment.appointment_time).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });

  const manageUrl = appointment.manage_token
    ? `${process.env.FRONTEND_URL || 'http://localhost:3000'}/appointment/${appointment.manage_token}`
    : null;
  const message = `Hi ${patient.name}, your appt with Dr. ${doctor.name} at ${clinic.name} is confirmed for ${date}.${manageUrl ? ` Cancel/Reschedule: ${manageUrl}` : ''} - MediBook`;
  const sent = await sendSms(patient.phone, message);
  await logSmsNotification(patient.id, 'confirmation', message, sent ? 'sent' : 'failed');
}

async function sendAppointmentSmsReminder({ patient, doctor, appointment, clinic, clinicId }) {
  const allowed = await canSendSms(clinicId);
  if (!allowed) return;

  if (!patient.phone) return;

  const date = new Date(appointment.appointment_time).toLocaleString('en-IN', {
    day: '2-digit', month: 'short',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });

  const message = `Reminder: Hi ${patient.name}, you have an appointment with Dr. ${doctor.name} tomorrow at ${date}. - ${clinic.name}`;
  const sent = await sendSms(patient.phone, message);
  await logSmsNotification(patient.id, 'reminder', message, sent ? 'sent' : 'failed');
}

async function sendAppointmentSmsCancellation({ patient, doctor, clinic, clinicId }) {
  const allowed = await canSendSms(clinicId);
  if (!allowed) return;

  if (!patient.phone) return;

  const message = `Hi ${patient.name}, your appointment with Dr. ${doctor.name} at ${clinic.name} has been cancelled. Please contact the clinic to reschedule. - MediBook`;
  const sent = await sendSms(patient.phone, message);
  await logSmsNotification(patient.id, 'cancellation', message, sent ? 'sent' : 'failed');
}

module.exports = { sendAppointmentSmsConfirmation, sendAppointmentSmsReminder, sendAppointmentSmsCancellation, canSendSms };
