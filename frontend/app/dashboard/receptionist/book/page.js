'use client'
import { useState, useEffect } from 'react'
import api from '../../../../services/api'

export default function ReceptionistBookPage() {
  const [doctors, setDoctors] = useState([])
  const [patients, setPatients] = useState([])
  const [slots, setSlots] = useState([])
  const [form, setForm] = useState({ doctor_id: '', date: '', slot: '', patient_id: '', symptoms: '' })
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(null)
  const [error, setError] = useState('')
  const [loadingSlots, setLoadingSlots] = useState(false)

  useEffect(() => {
    async function load() {
      const [docRes, patRes] = await Promise.all([api.get('/api/doctors'), api.get('/api/patients')])
      setDoctors(docRes.data)
      setPatients(patRes.data)
    }
    load()
  }, [])

  useEffect(() => {
    if (!form.doctor_id || !form.date) { setSlots([]); return }
    setLoadingSlots(true)
    api.get(`/api/doctors/${form.doctor_id}/slots`, { params: { date: form.date } })
      .then((res) => setSlots(res.data.slots || []))
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false))
  }, [form.doctor_id, form.date])

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (field === 'doctor_id' || field === 'date') setForm((prev) => ({ ...prev, [field]: value, slot: '' }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.doctor_id || !form.slot || !form.patient_id) {
      setError('Please fill all required fields.')
      return
    }
    setSaving(true)
    try {
      const res = await api.post('/api/appointments', {
        doctor_id: Number(form.doctor_id),
        patient_id: Number(form.patient_id),
        appointment_time: `${form.date}T${form.slot}:00`,
        symptoms: form.symptoms || null,
      })
      setSuccess(res.data)
      setForm({ doctor_id: '', date: '', slot: '', patient_id: '', symptoms: '' })
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to book appointment.')
    }
    setSaving(false)
  }

  if (success) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Book Appointment</h1>
        <div className="bg-green-50 border border-green-200 rounded-xl p-8 max-w-lg text-center">
          <p className="text-3xl mb-3">✅</p>
          <h2 className="text-lg font-semibold text-green-800 mb-1">Appointment Booked</h2>
          <p className="text-sm text-green-700">
            {patients.find((p) => p.id === success.patient_id)?.name || 'Patient'} with{' '}
            {doctors.find((d) => d.id === success.doctor_id)?.name || 'Doctor'} on{' '}
            {new Date(success.appointment_time).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
          </p>
          <button
            onClick={() => setSuccess(null)}
            className="mt-5 bg-green-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-green-700"
          >
            Book Another
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Book Appointment</h1>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-6 max-w-lg space-y-4">
        {error && <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">{error}</p>}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Doctor *</label>
          <select
            value={form.doctor_id}
            onChange={(e) => set('doctor_id', e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select a doctor</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>{d.name} — {d.specialization}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
          <input
            type="date"
            value={form.date}
            min={new Date().toISOString().split('T')[0]}
            onChange={(e) => set('date', e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Time Slot *</label>
          {loadingSlots ? (
            <p className="text-xs text-gray-400">Loading slots…</p>
          ) : slots.length === 0 ? (
            <p className="text-xs text-gray-400">{form.doctor_id && form.date ? 'No slots available for this date.' : 'Select a doctor and date first.'}</p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {slots.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, slot: s }))}
                  className={`text-xs px-3 py-2 rounded-lg border transition-colors ${
                    form.slot === s
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {(() => { const [h, m] = s.split(':').map(Number); const p = h >= 12 ? 'PM' : 'AM'; return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${p}` })()}
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Patient *</label>
          <select
            value={form.patient_id}
            onChange={(e) => setForm((prev) => ({ ...prev, patient_id: e.target.value }))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select a patient</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>{p.name} — {p.phone}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Symptoms (optional)</label>
          <textarea
            value={form.symptoms}
            onChange={(e) => setForm((prev) => ({ ...prev, symptoms: e.target.value }))}
            rows={2}
            placeholder="Brief description of symptoms…"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Booking…' : 'Book Appointment'}
        </button>
      </form>
    </div>
  )
}
