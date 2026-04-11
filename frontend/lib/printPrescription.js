export function printPrescription(rx) {
  const meds = Array.isArray(rx.medications)
    ? rx.medications
    : JSON.parse(rx.medications || '[]')

  const dob = rx.date_of_birth
    ? new Date(rx.date_of_birth).toLocaleDateString('en-US', { dateStyle: 'medium' })
    : null

  const issuedDate = new Date(rx.issued_at).toLocaleDateString('en-US', {
    dateStyle: 'long',
  })

  const medsRows = meds
    .map(
      (m, i) => `
      <tr>
        <td>${i + 1}</td>
        <td><strong>${m.name || '—'}</strong></td>
        <td>${m.dosage || '—'}</td>
        <td>${m.frequency || '—'}</td>
        <td>${m.duration || '—'}</td>
        <td>${m.instructions || '—'}</td>
      </tr>`
    )
    .join('')

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Prescription — ${rx.patient_name}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; color: #111; background: #fff; padding: 40px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 20px; border-bottom: 2px solid #1d4ed8; margin-bottom: 20px; }
    .clinic-name { font-size: 22px; font-weight: 700; color: #1d4ed8; }
    .clinic-info { font-size: 11px; color: #555; margin-top: 4px; line-height: 1.6; }
    .rx-label { font-size: 28px; font-weight: 800; color: #1d4ed8; opacity: 0.15; letter-spacing: 2px; }
    .section { display: flex; gap: 40px; margin-bottom: 20px; }
    .field { flex: 1; }
    .label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #888; margin-bottom: 2px; }
    .value { font-size: 13px; color: #111; font-weight: 500; }
    .divider { border: none; border-top: 1px solid #e5e7eb; margin: 16px 0; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    thead tr { background: #eff6ff; }
    th { text-align: left; padding: 8px 10px; font-size: 11px; font-weight: 600; text-transform: uppercase; color: #3b82f6; border-bottom: 1px solid #dbeafe; }
    td { padding: 9px 10px; font-size: 12px; border-bottom: 1px solid #f3f4f6; vertical-align: top; }
    tr:last-child td { border-bottom: none; }
    .notes-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 12px; font-size: 12px; color: #555; margin-bottom: 24px; }
    .footer { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 40px; padding-top: 16px; border-top: 1px solid #e5e7eb; }
    .signature-line { width: 180px; border-top: 1px solid #333; padding-top: 6px; font-size: 11px; color: #555; text-align: center; }
    .issued { font-size: 11px; color: #888; }
    @media print {
      body { padding: 20px; }
      @page { margin: 1cm; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="clinic-name">${rx.clinic_name || 'Clinic'}</div>
      <div class="clinic-info">
        ${rx.clinic_address ? rx.clinic_address + '<br/>' : ''}
        ${rx.clinic_phone ? 'Tel: ' + rx.clinic_phone : ''}
      </div>
    </div>
    <div class="rx-label">Rx</div>
  </div>

  <div class="section">
    <div class="field">
      <div class="label">Patient</div>
      <div class="value">${rx.patient_name}</div>
    </div>
    ${dob ? `<div class="field"><div class="label">Date of Birth</div><div class="value">${dob}</div></div>` : ''}
    ${rx.patient_phone ? `<div class="field"><div class="label">Phone</div><div class="value">${rx.patient_phone}</div></div>` : ''}
    <div class="field">
      <div class="label">Date Issued</div>
      <div class="value">${issuedDate}</div>
    </div>
  </div>

  <div class="section">
    <div class="field">
      <div class="label">Prescribing Doctor</div>
      <div class="value">Dr. ${rx.doctor_name}</div>
    </div>
    ${rx.specialization ? `<div class="field"><div class="label">Specialization</div><div class="value">${rx.specialization}</div></div>` : ''}
  </div>

  <hr class="divider" />

  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Medication</th>
        <th>Dosage</th>
        <th>Frequency</th>
        <th>Duration</th>
        <th>Instructions</th>
      </tr>
    </thead>
    <tbody>
      ${medsRows}
    </tbody>
  </table>

  ${rx.notes ? `<div class="notes-box"><strong>Notes:</strong> ${rx.notes}</div>` : ''}

  <div class="footer">
    <div class="issued">Prescription ID: #${rx.id}</div>
    <div class="signature-line">
      Dr. ${rx.doctor_name}<br/>Signature
    </div>
  </div>

  <script>window.onload = function() { window.print(); }</script>
</body>
</html>`

  const win = window.open('', '_blank')
  win.document.write(html)
  win.document.close()
}
