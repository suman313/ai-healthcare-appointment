const nodemailer = require('nodemailer');
const pool = require('../config/db');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_FROM,
    pass: process.env.EMAIL_PASSWORD,
  },
});

async function sendEmail({ to, subject, html }) {
  if (!process.env.EMAIL_FROM || !process.env.EMAIL_PASSWORD) {
    console.log('[Email] Not configured — skipping send to:', to);
    return false;
  }
  try {
    await transporter.sendMail({ from: `MediBook <${process.env.EMAIL_FROM}>`, to, subject, html });
    return true;
  } catch (err) {
    console.error('[Email] Failed to send:', err.message);
    return false;
  }
}

async function logNotification(patientId, type, message, status) {
  try {
    await pool.query(
      `INSERT INTO notifications (patient_id, type, message, status) VALUES ($1, $2, $3, $4)`,
      [patientId, type, message, status]
    );
  } catch (err) {
    console.error('[Notification] Failed to log:', err.message);
  }
}

async function sendAppointmentConfirmation({ patient, doctor, appointment, clinic }) {
  const date = new Date(appointment.appointment_time).toLocaleString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  const message = `Your appointment with Dr. ${doctor.name} is confirmed for ${date}.`;
  const manageUrl = appointment.manage_token
    ? `${process.env.FRONTEND_URL || 'http://localhost:3000'}/appointment/${appointment.manage_token}`
    : null;

  const html = `
    <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
      <div style="background: #2563eb; padding: 24px; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 22px;">Appointment Confirmed</h1>
      </div>
      <div style="background: #f8fafc; padding: 24px; border-radius: 0 0 8px 8px; border: 1px solid #e2e8f0;">
        <p style="color: #374151;">Hi <strong>${patient.name}</strong>,</p>
        <p style="color: #374151;">Your appointment has been confirmed. Here are the details:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 8px; color: #6b7280; width: 40%;">Clinic</td><td style="padding: 8px; color: #111827; font-weight: 600;">${clinic.name}</td></tr>
          <tr style="background: #fff;"><td style="padding: 8px; color: #6b7280;">Doctor</td><td style="padding: 8px; color: #111827; font-weight: 600;">Dr. ${doctor.name}</td></tr>
          <tr><td style="padding: 8px; color: #6b7280;">Specialization</td><td style="padding: 8px; color: #111827;">${doctor.specialization || 'General Physician'}</td></tr>
          <tr style="background: #fff;"><td style="padding: 8px; color: #6b7280;">Date & Time</td><td style="padding: 8px; color: #111827; font-weight: 600;">${date}</td></tr>
        </table>
        ${manageUrl ? `
        <div style="margin-top: 20px; padding: 16px; background: #eff6ff; border-radius: 8px; text-align: center;">
          <p style="color: #1d4ed8; font-weight: 600; margin: 0 0 12px;">Need to make changes?</p>
          <a href="${manageUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 10px 24px; border-radius: 6px; text-decoration: none; font-size: 14px; margin-right: 8px;">Reschedule</a>
          <a href="${manageUrl}" style="display: inline-block; background: #dc2626; color: white; padding: 10px 24px; border-radius: 6px; text-decoration: none; font-size: 14px;">Cancel</a>
        </div>` : ''}
        <p style="color: #6b7280; font-size: 13px; margin-top: 16px;">— ${clinic.name} Team</p>
      </div>
    </div>
  `;

  const sent = patient.email ? await sendEmail({ to: patient.email, subject: `Appointment Confirmed — ${clinic.name}`, html }) : false;
  await logNotification(patient.id, 'appointment_confirmation', message, sent ? 'sent' : 'failed');
}

async function sendAppointmentReminder({ patient, doctor, appointment, clinic }) {
  const date = new Date(appointment.appointment_time).toLocaleString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  const message = `Reminder: Your appointment with Dr. ${doctor.name} is tomorrow at ${date}.`;

  const html = `
    <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
      <div style="background: #f59e0b; padding: 24px; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 22px;">Appointment Reminder</h1>
      </div>
      <div style="background: #f8fafc; padding: 24px; border-radius: 0 0 8px 8px; border: 1px solid #e2e8f0;">
        <p style="color: #374151;">Hi <strong>${patient.name}</strong>,</p>
        <p style="color: #374151;">This is a reminder that you have an appointment <strong>tomorrow</strong>.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 8px; color: #6b7280; width: 40%;">Doctor</td><td style="padding: 8px; color: #111827; font-weight: 600;">Dr. ${doctor.name}</td></tr>
          <tr style="background: #fff;"><td style="padding: 8px; color: #6b7280;">Date & Time</td><td style="padding: 8px; color: #111827; font-weight: 600;">${date}</td></tr>
          <tr><td style="padding: 8px; color: #6b7280;">Clinic</td><td style="padding: 8px; color: #111827;">${clinic.name}</td></tr>
        </table>
        <p style="color: #6b7280; font-size: 13px;">Please arrive 10 minutes early.</p>
        <p style="color: #6b7280; font-size: 13px;">— ${clinic.name} Team</p>
      </div>
    </div>
  `;

  const sent = patient.email ? await sendEmail({ to: patient.email, subject: `Reminder: Appointment Tomorrow — ${clinic.name}`, html }) : false;
  await logNotification(patient.id, 'appointment_reminder', message, sent ? 'sent' : 'failed');
}

async function sendCancellationNotice({ patient, doctor, appointment, clinic }) {
  const date = new Date(appointment.appointment_time).toLocaleString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  const message = `Your appointment with Dr. ${doctor.name} on ${date} has been cancelled.`;

  const html = `
    <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
      <div style="background: #dc2626; padding: 24px; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 22px;">Appointment Cancelled</h1>
      </div>
      <div style="background: #f8fafc; padding: 24px; border-radius: 0 0 8px 8px; border: 1px solid #e2e8f0;">
        <p style="color: #374151;">Hi <strong>${patient.name}</strong>,</p>
        <p style="color: #374151;">Your appointment has been cancelled.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 8px; color: #6b7280; width: 40%;">Doctor</td><td style="padding: 8px; color: #111827; font-weight: 600;">Dr. ${doctor.name}</td></tr>
          <tr style="background: #fff;"><td style="padding: 8px; color: #6b7280;">Was scheduled for</td><td style="padding: 8px; color: #111827;">${date}</td></tr>
        </table>
        <p style="color: #6b7280; font-size: 13px;">Please contact the clinic to reschedule.</p>
        <p style="color: #6b7280; font-size: 13px;">— ${clinic.name} Team</p>
      </div>
    </div>
  `;

  const sent = patient.email ? await sendEmail({ to: patient.email, subject: `Appointment Cancelled — ${clinic.name}`, html }) : false;
  await logNotification(patient.id, 'cancellation', message, sent ? 'sent' : 'failed');
}

module.exports = { sendAppointmentConfirmation, sendAppointmentReminder, sendCancellationNotice };
