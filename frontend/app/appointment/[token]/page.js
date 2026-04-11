'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import axios from 'axios'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export default function ManageAppointmentPage() {
  const { token } = useParams()
  const [appointment, setAppointment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [view, setView] = useState('main') // 'main' | 'reschedule' | 'done'
  const [doneMsg, setDoneMsg] = useState('')

  // Reschedule state
  const [selectedDate, setSelectedDate] = useState('')
  const [slots, setSlots] = useState([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    axios.get(`${API}/api/manage/${token}`)
      .then((res) => setAppointment(res.data))
      .catch(() => setError('Appointment not found or link has expired.'))
      .finally(() => setLoading(false))
  }, [token])

  async function loadSlots(date) {
    setSelectedDate(date)
    setSelectedSlot('')
    if (!date) return
    setSlotsLoading(true)
    try {
      const res = await axios.get(`${API}/api/manage/${token}/slots?date=${date}`)
      setSlots(res.data.slots || [])
    } catch {
      setSlots([])
    }
    setSlotsLoading(false)
  }

  async function handleCancel() {
    if (!confirm('Are you sure you want to cancel this appointment?')) return
    setSubmitting(true)
    try {
      await axios.post(`${API}/api/manage/${token}/cancel`)
      setDoneMsg('Your appointment has been cancelled. You will receive a confirmation shortly.')
      setView('done')
    } catch (err) {
      setError(err.response?.data?.error || 'Cancellation failed. Please try again.')
    }
    setSubmitting(false)
  }

  async function handleReschedule() {
    if (!selectedDate || !selectedSlot) return
    setSubmitting(true)
    const newTime = `${selectedDate}T${selectedSlot}:00`
    try {
      await axios.post(`${API}/api/manage/${token}/reschedule`, { new_time: newTime })
      setDoneMsg('Your appointment has been rescheduled. A new confirmation has been sent to you.')
      setView('done')
    } catch (err) {
      setError(err.response?.data?.error || 'Reschedule failed. Please try again.')
    }
    setSubmitting(false)
  }

  // Minimum date = tomorrow
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minDate = tomorrow.toISOString().split('T')[0]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">Loading…</p>
      </div>
    )
  }

  if (error && !appointment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-md w-full text-center">
          <div className="text-4xl mb-4">❌</div>
          <h1 className="text-lg font-semibold text-gray-900 mb-2">Link Not Found</h1>
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      </div>
    )
  }

  if (view === 'done') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-md w-full text-center">
          <div className="text-4xl mb-4">✅</div>
          <h1 className="text-lg font-semibold text-gray-900 mb-2">Done!</h1>
          <p className="text-sm text-gray-500">{doneMsg}</p>
        </div>
      </div>
    )
  }

  const apptDate = new Date(appointment.appointment_time).toLocaleString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  })

  const isCancelled = appointment.status === 'cancelled'
  const isCompleted = appointment.status === 'completed'
  const isActionable = !isCancelled && !isCompleted

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="bg-white rounded-xl border border-gray-200 w-full max-w-md shadow-sm">

        {/* Header */}
        <div className="bg-blue-600 px-6 py-5 rounded-t-xl">
          <p className="text-blue-100 text-xs mb-1">Appointment Details</p>
          <h1 className="text-white text-xl font-bold">{appointment.clinic_name}</h1>
        </div>

        {/* Appointment Info */}
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="space-y-3">
            {[
              { label: 'Patient', value: appointment.patient_name },
              { label: 'Doctor', value: `Dr. ${appointment.doctor_name}` },
              { label: 'Specialization', value: appointment.specialization || 'General Physician' },
              { label: 'Date & Time', value: apptDate },
              { label: 'Status', value: appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1) },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-gray-500">{label}</span>
                <span className={`font-medium ${label === 'Status' && isCancelled ? 'text-red-600' : label === 'Status' && isCompleted ? 'text-green-600' : 'text-gray-900'}`}>
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-5">
          {!isActionable && (
            <p className="text-sm text-center text-gray-400">
              {isCancelled ? 'This appointment has been cancelled.' : 'This appointment has been completed.'}
            </p>
          )}

          {isActionable && view === 'main' && (
            <div className="space-y-3">
              {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
              <button
                onClick={() => { setView('reschedule'); setError('') }}
                className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                Reschedule Appointment
              </button>
              <button
                onClick={handleCancel}
                disabled={submitting}
                className="w-full border border-red-300 text-red-600 py-2.5 rounded-lg text-sm font-medium hover:bg-red-50 disabled:opacity-50"
              >
                {submitting ? 'Cancelling…' : 'Cancel Appointment'}
              </button>
            </div>
          )}

          {isActionable && view === 'reschedule' && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-gray-800">Choose a New Date & Time</h2>
              {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

              <div>
                <label className="block text-xs text-gray-500 mb-1">Select Date</label>
                <input
                  type="date"
                  min={minDate}
                  value={selectedDate}
                  onChange={(e) => loadSlots(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {selectedDate && (
                <div>
                  <label className="block text-xs text-gray-500 mb-2">Available Slots</label>
                  {slotsLoading ? (
                    <p className="text-xs text-gray-400">Loading slots…</p>
                  ) : slots.length === 0 ? (
                    <p className="text-xs text-gray-400">No slots available on this day. Try another date.</p>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {slots.map((s) => (
                        <button
                          key={s}
                          onClick={() => setSelectedSlot(s)}
                          className={`py-2 rounded-lg text-xs font-medium border transition-colors ${
                            selectedSlot === s
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'border-gray-200 text-gray-700 hover:border-blue-400'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => { setView('main'); setError(''); setSelectedDate(''); setSlots([]) }}
                  className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  onClick={handleReschedule}
                  disabled={!selectedDate || !selectedSlot || submitting}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? 'Saving…' : 'Confirm Reschedule'}
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-gray-300 pb-4">Powered by MediBook</p>
      </div>
    </div>
  )
}
