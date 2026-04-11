'use client'
import { useState, useEffect } from 'react'
import api from '../../../services/api'
import { getUser } from '../../../lib/auth'
import VisitPanel from '../../../components/VisitPanel'

const STATUS_COLORS = {
  booked: 'bg-blue-50 text-blue-700',
  completed: 'bg-green-50 text-green-700',
  cancelled: 'bg-gray-100 text-gray-500',
  no_show: 'bg-red-50 text-red-600',
}

export default function DoctorSchedulePage() {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null) // appointment for visit panel
  const user = getUser()

  async function load() {
    try {
      const res = await api.get('/api/appointments')
      const today = new Date().toDateString()
      // Filter only this doctor's appointments for today
      const mine = res.data
        .filter((a) => {
          const sameDay = new Date(a.appointment_time).toDateString() === today
          // Match by doctor_id if available, or fall back to all
          return sameDay && (user?.doctor_id ? a.doctor_id === user.doctor_id : true)
        })
        .sort((a, b) => new Date(a.appointment_time) - new Date(b.appointment_time))
      setAppointments(mine)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Schedule Today</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm">Loading…</p>
      ) : appointments.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <p className="text-gray-400">No patients scheduled for today.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {appointments.map((a) => (
            <div
              key={a.id}
              className="bg-white border border-gray-200 rounded-xl p-5 flex items-center justify-between hover:shadow-sm transition-shadow"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">
                  {a.patient_name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{a.patient_name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {new Date(a.appointment_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    {a.symptoms && ` · ${a.symptoms}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[a.status]}`}>
                  {a.status.replace('_', ' ')}
                </span>
                <button
                  onClick={() => setSelected(a)}
                  className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-700"
                >
                  Open Visit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <VisitPanel
          appointment={selected}
          onClose={() => { setSelected(null); load() }}
        />
      )}
    </div>
  )
}
