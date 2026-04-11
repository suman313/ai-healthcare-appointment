'use client'
import { useState, useEffect } from 'react'
import api from '../../../services/api'
import Modal from '../../../components/Modal'

const STATUS_COLORS = {
  booked: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-500',
  no_show: 'bg-red-100 text-red-600',
}

const STATUSES = ['all', 'booked', 'completed', 'cancelled', 'no_show']

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [modal, setModal] = useState(null) // { mode: 'add' | 'status', appointment? }
  const [doctors, setDoctors] = useState([])
  const [patients, setPatients] = useState([])
  const [form, setForm] = useState({ doctor_id: '', patient_id: '', appointment_time: '', symptoms: '' })
  const [statusUpdate, setStatusUpdate] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    try {
      const [apptRes, docRes, patRes] = await Promise.all([
        api.get('/api/appointments'),
        api.get('/api/doctors'),
        api.get('/api/patients'),
      ])
      setAppointments(apptRes.data)
      setDoctors(docRes.data)
      setPatients(patRes.data)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const filtered = filter === 'all' ? appointments : appointments.filter((a) => a.status === filter)

  async function handleAdd(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await api.post('/api/appointments', {
        doctor_id: Number(form.doctor_id),
        patient_id: Number(form.patient_id),
        appointment_time: form.appointment_time,
        symptoms: form.symptoms || null,
      })
      setModal(null)
      load()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create appointment')
    } finally {
      setSaving(false)
    }
  }

  async function handleStatusUpdate() {
    if (!statusUpdate) return
    setSaving(true)
    try {
      await api.put(`/api/appointments/${modal.appointment.id}`, { status: statusUpdate })
      setModal(null)
      load()
    } catch {}
    setSaving(false)
  }

  async function handleDelete(id) {
    if (!confirm('Delete this appointment?')) return
    try {
      await api.delete(`/api/appointments/${id}`)
      load()
    } catch {}
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage all clinic appointments</p>
        </div>
        <button
          onClick={() => { setForm({ doctor_id: '', patient_id: '', appointment_time: '', symptoms: '' }); setError(''); setModal({ mode: 'add' }) }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          + New Appointment
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize border transition-colors ${
              filter === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
            }`}
          >
            {s.replace('_', ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm">Loading…</p>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-400">No appointments found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr className="text-left text-gray-500">
                <th className="px-5 py-3 font-medium">Patient</th>
                <th className="px-5 py-3 font-medium">Doctor</th>
                <th className="px-5 py-3 font-medium">Date & Time</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-900">{a.patient_name}</td>
                  <td className="px-5 py-3 text-gray-600">{a.doctor_name}</td>
                  <td className="px-5 py-3 text-gray-600">
                    {new Date(a.appointment_time).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[a.status] || ''}`}>
                      {a.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right space-x-3">
                    <button
                      onClick={() => { setStatusUpdate(a.status); setModal({ mode: 'status', appointment: a }) }}
                      className="text-blue-600 hover:underline text-xs"
                    >
                      Update
                    </button>
                    <button onClick={() => handleDelete(a.id)} className="text-red-500 hover:underline text-xs">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Modal */}
      <Modal isOpen={modal?.mode === 'add'} onClose={() => setModal(null)} title="New Appointment">
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Doctor</label>
            <select
              required
              value={form.doctor_id}
              onChange={(e) => setForm((f) => ({ ...f, doctor_id: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select doctor…</option>
              {doctors.map((d) => <option key={d.id} value={d.id}>{d.name} — {d.specialization || 'General'}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Patient</label>
            <select
              required
              value={form.patient_id}
              onChange={(e) => setForm((f) => ({ ...f, patient_id: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select patient…</option>
              {patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
            <input
              type="datetime-local"
              required
              value={form.appointment_time}
              onChange={(e) => setForm((f) => ({ ...f, appointment_time: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Symptoms (optional)</label>
            <textarea
              value={form.symptoms}
              onChange={(e) => setForm((f) => ({ ...f, symptoms: e.target.value }))}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModal(null)} className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Creating…' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Status Modal */}
      <Modal isOpen={modal?.mode === 'status'} onClose={() => setModal(null)} title="Update Status">
        <div className="space-y-3 mb-5">
          {['booked', 'completed', 'cancelled', 'no_show'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusUpdate(s)}
              className={`w-full text-left px-4 py-3 rounded-lg border text-sm capitalize transition-colors ${
                statusUpdate === s ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <button onClick={() => setModal(null)} className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
          <button onClick={handleStatusUpdate} disabled={saving} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
            {saving ? 'Saving…' : 'Update'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
