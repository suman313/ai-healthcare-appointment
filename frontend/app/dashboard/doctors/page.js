'use client'
import { useState, useEffect } from 'react'
import api from '../../../services/api'
import Modal from '../../../components/Modal'

const EMPTY = { name: '', specialization: '', phone: '', email: '' }

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // null | { mode: 'add' | 'edit', doctor?: {} }
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Slots modal state
  const [slotsModal, setSlotsModal] = useState(null) // null | { doctor }
  const [slotsDate, setSlotsDate] = useState(todayStr())
  const [slots, setSlots] = useState([])
  const [slotsLoading, setSlotsLoading] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const res = await api.get('/api/doctors')
      setDoctors(res.data)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function openAdd() {
    setForm(EMPTY)
    setError('')
    setModal({ mode: 'add' })
  }

  function openEdit(doctor) {
    setForm({ name: doctor.name, specialization: doctor.specialization || '', phone: doctor.phone || '', email: doctor.email || '' })
    setError('')
    setModal({ mode: 'edit', doctor })
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (modal.mode === 'add') {
        await api.post('/api/doctors', form)
      } else {
        await api.put(`/api/doctors/${modal.doctor.id}`, form)
      }
      setModal(null)
      load()
    } catch (err) {
      setError(err.response?.data?.error || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this doctor?')) return
    try {
      await api.delete(`/api/doctors/${id}`)
      load()
    } catch {}
  }

  function openSlots(doctor) {
    setSlotsModal({ doctor })
    setSlotsDate(todayStr())
    setSlots([])
    fetchSlots(doctor.id, todayStr())
  }

  async function fetchSlots(doctorId, date) {
    setSlotsLoading(true)
    try {
      const res = await api.get(`/api/doctors/${doctorId}/slots?date=${date}`)
      setSlots(res.data.slots || [])
    } catch {
      setSlots([])
    }
    setSlotsLoading(false)
  }

  function handleSlotsDateChange(date) {
    setSlotsDate(date)
    if (slotsModal) fetchSlots(slotsModal.doctor.id, date)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Doctors</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your clinic's doctors</p>
        </div>
        <button
          onClick={openAdd}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          + Add Doctor
        </button>
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm">Loading…</p>
      ) : doctors.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-400 mb-4">No doctors added yet.</p>
          <button onClick={openAdd} className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
            Add First Doctor
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr className="text-left text-gray-500">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Specialization</th>
                <th className="px-5 py-3 font-medium">Phone</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Available Slots</th>
                <th className="px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {doctors.map((d) => (
                <tr key={d.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-900">{d.name}</td>
                  <td className="px-5 py-3 text-gray-600">{d.specialization || '—'}</td>
                  <td className="px-5 py-3 text-gray-600">{d.phone || '—'}</td>
                  <td className="px-5 py-3 text-gray-600">{d.email || '—'}</td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => openSlots(d)}
                      className="text-xs bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded-md hover:bg-green-100"
                    >
                      View Slots
                    </button>
                  </td>
                  <td className="px-5 py-3 text-right space-x-3">
                    <button onClick={() => openEdit(d)} className="text-blue-600 hover:underline text-xs">Edit</button>
                    <button onClick={() => handleDelete(d.id)} className="text-red-500 hover:underline text-xs">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        isOpen={!!slotsModal}
        onClose={() => setSlotsModal(null)}
        title={`Available Slots — ${slotsModal?.doctor?.name || ''}`}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={slotsDate}
              onChange={(e) => handleSlotsDateChange(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {slotsDate && (
              <span className="ml-3 text-xs text-gray-400">
                {DAY_NAMES[new Date(slotsDate + 'T00:00:00').getDay()]}
              </span>
            )}
          </div>

          {slotsLoading ? (
            <p className="text-sm text-gray-400">Loading slots…</p>
          ) : slots.length === 0 ? (
            <p className="text-sm text-gray-500 bg-gray-50 rounded-lg px-4 py-3">
              No available slots for this date.
            </p>
          ) : (
            <div>
              <p className="text-xs text-gray-500 mb-2">{slots.length} slot{slots.length !== 1 ? 's' : ''} available</p>
              <div className="flex flex-wrap gap-2 max-h-56 overflow-y-auto">
                {slots.map((slot) => (
                  <span
                    key={slot}
                    className="bg-blue-50 text-blue-700 border border-blue-200 text-xs font-medium px-3 py-1.5 rounded-md"
                  >
                    {slot}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={!!modal}
        onClose={() => setModal(null)}
        title={modal?.mode === 'add' ? 'Add Doctor' : 'Edit Doctor'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          {[
            { label: 'Name', field: 'name', required: true },
            { label: 'Specialization', field: 'specialization' },
            { label: 'Phone', field: 'phone' },
            { label: 'Email', field: 'email', type: 'email' },
          ].map(({ label, field, type = 'text', required }) => (
            <div key={field}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <input
                type={type}
                required={required}
                value={form[field]}
                onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ))}
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModal(null)} className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
