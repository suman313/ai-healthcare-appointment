'use client'
import { useState, useEffect } from 'react'
import api from '../../../services/api'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const DEFAULT_SLOT = { day_of_week: 1, start_time: '09:00', end_time: '17:00', slot_duration: 15 }

export default function SchedulePage() {
  const [doctors, setDoctors] = useState([])
  const [selectedDoctorId, setSelectedDoctorId] = useState('')
  const [availability, setAvailability] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    api.get('/api/doctors').then((r) => setDoctors(r.data)).catch(() => {})
  }, [])

  useEffect(() => {
    if (!selectedDoctorId) return
    setLoading(true)
    api.get(`/api/doctors/${selectedDoctorId}/availability`)
      .then((r) => setAvailability(r.data))
      .catch(() => setAvailability([]))
      .finally(() => setLoading(false))
  }, [selectedDoctorId])

  function addSlot() {
    setAvailability((prev) => [...prev, { ...DEFAULT_SLOT }])
  }

  function removeSlot(idx) {
    setAvailability((prev) => prev.filter((_, i) => i !== idx))
  }

  function updateSlot(idx, field, value) {
    setAvailability((prev) => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s))
  }

  async function handleSave() {
    if (!selectedDoctorId) return
    setSaving(true)
    setSaved(false)
    try {
      await api.post(`/api/doctors/${selectedDoctorId}/availability`, { slots: availability })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {}
    setSaving(false)
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Schedule</h1>
        <p className="text-sm text-gray-500 mt-0.5">Set doctor availability and slot durations</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Doctor</label>
        <select
          value={selectedDoctorId}
          onChange={(e) => setSelectedDoctorId(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
        >
          <option value="">Choose a doctor…</option>
          {doctors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>

      {selectedDoctorId && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-gray-900">Availability Slots</h2>
            <button onClick={addSlot} className="text-sm text-blue-600 hover:underline">+ Add Slot</button>
          </div>

          {loading ? (
            <p className="text-gray-400 text-sm">Loading…</p>
          ) : availability.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 text-sm mb-3">No availability set yet.</p>
              <button onClick={addSlot} className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
                Add First Slot
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {availability.map((slot, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-3 items-end p-4 border border-gray-100 rounded-lg bg-gray-50">
                  <div className="col-span-3">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Day</label>
                    <select
                      value={slot.day_of_week}
                      onChange={(e) => updateSlot(idx, 'day_of_week', Number(e.target.value))}
                      className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Start</label>
                    <input
                      type="time"
                      value={slot.start_time?.slice(0, 5) || ''}
                      onChange={(e) => updateSlot(idx, 'start_time', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-500 mb-1">End</label>
                    <input
                      type="time"
                      value={slot.end_time?.slice(0, 5) || ''}
                      onChange={(e) => updateSlot(idx, 'end_time', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="col-span-3">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Slot Duration (min)</label>
                    <select
                      value={slot.slot_duration}
                      onChange={(e) => updateSlot(idx, 'slot_duration', Number(e.target.value))}
                      className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {[10, 15, 20, 30, 45, 60].map((m) => <option key={m} value={m}>{m} min</option>)}
                    </select>
                  </div>
                  <div className="col-span-2 flex justify-end">
                    <button
                      onClick={() => removeSlot(idx)}
                      className="text-red-400 hover:text-red-600 text-sm px-3 py-2 rounded-lg hover:bg-red-50"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {availability.length > 0 && (
            <div className="flex items-center gap-4 mt-6">
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save Availability'}
              </button>
              {saved && <span className="text-green-600 text-sm">✓ Saved successfully</span>}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
