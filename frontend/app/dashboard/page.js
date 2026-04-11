'use client'
import { useState, useEffect } from 'react'
import api from '../../services/api'
import { getUser } from '../../lib/auth'

export default function DashboardPage() {
  const [stats, setStats] = useState({ doctors: 0, patients: 0, today: 0, upcoming: [] })
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const user = getUser()
  const bookingUrl = typeof window !== 'undefined' && user?.clinic_id
    ? `${window.location.origin}/booking/${user.clinic_id}`
    : null

  function copyLink() {
    if (!bookingUrl) return
    navigator.clipboard.writeText(bookingUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  useEffect(() => {
    async function load() {
      try {
        const [doctorsRes, patientsRes, apptRes] = await Promise.all([
          api.get('/api/doctors'),
          api.get('/api/patients'),
          api.get('/api/appointments'),
        ])
        const today = new Date().toDateString()
        const todayCount = apptRes.data.filter(
          (a) => new Date(a.appointment_time).toDateString() === today && a.status === 'booked'
        ).length
        const upcoming = apptRes.data
          .filter((a) => new Date(a.appointment_time) >= new Date() && a.status === 'booked')
          .slice(0, 5)
        setStats({
          doctors: doctorsRes.data.length,
          patients: patientsRes.data.length,
          today: todayCount,
          upcoming,
        })
      } catch {}
      setLoading(false)
    }
    load()
  }, [])

  const cards = [
    { label: 'Total Doctors', value: stats.doctors, icon: '👨‍⚕️', color: 'bg-blue-50 text-blue-700' },
    { label: 'Total Patients', value: stats.patients, icon: '🧑‍🤝‍🧑', color: 'bg-purple-50 text-purple-700' },
    { label: "Today's Appointments", value: stats.today, icon: '📅', color: 'bg-green-50 text-green-700' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Overview</h1>
      <p className="text-gray-500 mb-6 text-sm">Welcome back. Here's what's happening today.</p>

      {bookingUrl && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-blue-800 mb-1">Your Patient Booking Link</p>
            <p className="text-sm text-blue-600 font-mono break-all">{bookingUrl}</p>
          </div>
          <button
            onClick={copyLink}
            className="shrink-0 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
        </div>
      )}

      {loading ? (
        <p className="text-gray-400">Loading…</p>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
            {cards.map(({ label, value, icon, color }) => (
              <div key={label} className="bg-white rounded-xl border border-gray-200 p-6 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${color}`}>{icon}</div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{value}</p>
                  <p className="text-sm text-gray-500">{label}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Upcoming Appointments</h2>
            {stats.upcoming.length === 0 ? (
              <p className="text-sm text-gray-400">No upcoming appointments.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-400 border-b border-gray-100">
                    <th className="pb-3 font-medium">Patient</th>
                    <th className="pb-3 font-medium">Doctor</th>
                    <th className="pb-3 font-medium">Date & Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {stats.upcoming.map((a) => (
                    <tr key={a.id}>
                      <td className="py-3 text-gray-900">{a.patient_name}</td>
                      <td className="py-3 text-gray-600">{a.doctor_name}</td>
                      <td className="py-3 text-gray-600">
                        {new Date(a.appointment_time).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  )
}
