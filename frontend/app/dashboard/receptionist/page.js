'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import api from '../../../services/api'
import { getUser } from '../../../lib/auth'

const STATUS_COLORS = {
  booked: 'bg-blue-50 text-blue-700',
  completed: 'bg-green-50 text-green-700',
  cancelled: 'bg-gray-100 text-gray-500',
  no_show: 'bg-red-50 text-red-600',
}

export default function ReceptionistQueuePage() {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(null)
  const user = getUser()

  const load = useCallback(async () => {
    try {
      const res = await api.get('/api/appointments')
      const today = new Date().toDateString()
      const todayAppts = res.data
        .filter((a) => new Date(a.appointment_time).toDateString() === today)
        .sort((a, b) => {
          // Checked-in patients sorted by queue number first
          if (a.queue_number && b.queue_number) return a.queue_number - b.queue_number
          if (a.queue_number) return -1
          if (b.queue_number) return 1
          return new Date(a.appointment_time) - new Date(b.appointment_time)
        })
      setAppointments(todayAppts)
    } catch {}
    setLoading(false)
  }, [])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    load()
    const interval = setInterval(load, 30000)
    return () => clearInterval(interval)
  }, [load])

  async function checkin(id) {
    setActing(id)
    try {
      await api.post(`/api/queue/checkin/${id}`)
      load()
    } catch {}
    setActing(null)
  }

  async function callPatient(id) {
    setActing(id)
    try {
      await api.post(`/api/queue/call/${id}`)
      load()
    } catch {}
    setActing(null)
  }

  async function updateStatus(id, status) {
    setActing(id)
    try {
      await api.put(`/api/appointments/${id}`, { status })
      load()
    } catch {}
    setActing(null)
  }

  const stats = {
    total: appointments.filter((a) => a.status !== 'cancelled').length,
    waiting: appointments.filter((a) => a.status === 'booked' && a.checked_in_at && !a.called_at).length,
    withDoctor: appointments.filter((a) => a.called_at && a.status !== 'completed').length,
    completed: appointments.filter((a) => a.status === 'completed').length,
  }

  const clinicId = user?.clinic_id

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Today's Queue</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-3">
          {clinicId && (
            <Link
              href={`/display/${clinicId}`}
              target="_blank"
              className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700"
            >
              Open Display Screen
            </Link>
          )}
          <button onClick={load} className="border border-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50">
            Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Today', value: stats.total, color: 'text-gray-700' },
          { label: 'Waiting', value: stats.waiting, color: 'text-blue-700' },
          { label: 'With Doctor', value: stats.withDoctor, color: 'text-purple-700' },
          { label: 'Completed', value: stats.completed, color: 'text-green-700' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-xl p-4 text-center">
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm">Loading…</p>
      ) : appointments.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <p className="text-gray-400">No appointments scheduled for today.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr className="text-left text-gray-500">
                <th className="px-5 py-3 font-medium w-12">#</th>
                <th className="px-5 py-3 font-medium">Time</th>
                <th className="px-5 py-3 font-medium">Patient</th>
                <th className="px-5 py-3 font-medium">Doctor</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {appointments.map((a) => {
                const isActing = acting === a.id
                const checkedIn = !!a.checked_in_at
                const called = !!a.called_at

                return (
                  <tr
                    key={a.id}
                    className={`transition-colors ${called && a.status !== 'completed' ? 'bg-purple-50' : 'hover:bg-gray-50'}`}
                  >
                    <td className="px-5 py-4">
                      {a.queue_number ? (
                        <span className="w-8 h-8 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                          {a.queue_number}
                        </span>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 font-medium text-gray-900">
                      {new Date(a.appointment_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-5 py-4 text-gray-900">{a.patient_name}</td>
                    <td className="px-5 py-4 text-gray-600">{a.doctor_name}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
                        called && a.status !== 'completed'
                          ? 'bg-purple-100 text-purple-700'
                          : STATUS_COLORS[a.status]
                      }`}>
                        {called && a.status !== 'completed' ? 'With Doctor' : a.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2 flex-wrap">
                        {/* Not yet checked in */}
                        {a.status === 'booked' && !checkedIn && (
                          <>
                            <button onClick={() => checkin(a.id)} disabled={isActing}
                              className="px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 disabled:opacity-50">
                              Check In
                            </button>
                            <button onClick={() => updateStatus(a.id, 'no_show')} disabled={isActing}
                              className="px-3 py-1 bg-red-100 text-red-600 text-xs rounded-lg hover:bg-red-200 disabled:opacity-50">
                              No-show
                            </button>
                          </>
                        )}

                        {/* Checked in but not yet called */}
                        {a.status === 'booked' && checkedIn && !called && (
                          <>
                            <button onClick={() => callPatient(a.id)} disabled={isActing}
                              className="px-3 py-1 bg-purple-600 text-white text-xs rounded-lg hover:bg-purple-700 disabled:opacity-50">
                              Call Patient
                            </button>
                            <button onClick={() => updateStatus(a.id, 'no_show')} disabled={isActing}
                              className="px-3 py-1 bg-red-100 text-red-600 text-xs rounded-lg hover:bg-red-200 disabled:opacity-50">
                              No-show
                            </button>
                          </>
                        )}

                        {/* Called / with doctor */}
                        {called && a.status !== 'completed' && (
                          <button onClick={() => updateStatus(a.id, 'completed')} disabled={isActing}
                            className="px-3 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 disabled:opacity-50">
                            Complete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
