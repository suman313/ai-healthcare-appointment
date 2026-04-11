'use client'
import { useState, useEffect } from 'react'
import api from '../../../../services/api'
import { getUser } from '../../../../lib/auth'

export default function DoctorPatientsPage() {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const user = getUser()

  useEffect(() => {
    async function load() {
      try {
        if (!user?.doctor_id) return
        const res = await api.get(`/api/medical-records/doctor/${user.doctor_id}`)
        // Unique patients
        const seen = new Set()
        const unique = res.data.filter((r) => {
          if (seen.has(r.patient_id)) return false
          seen.add(r.patient_id)
          return true
        })
        setRecords(unique)
      } catch {}
      setLoading(false)
    }
    load()
  }, [user])

  const filtered = records.filter((r) =>
    r.patient_name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Patients</h1>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search patients…"
        className="w-full max-w-sm border border-gray-200 rounded-lg px-3 py-2 text-sm mb-5 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {loading ? (
        <p className="text-gray-400 text-sm">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="text-gray-400 text-sm">{search ? 'No patients match.' : 'No patient records yet.'}</p>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left text-gray-400 border-b border-gray-200">
                <th className="px-5 py-3 font-medium">Patient</th>
                <th className="px-5 py-3 font-medium">Last Visit</th>
                <th className="px-5 py-3 font-medium">Diagnosis</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((r) => (
                <tr key={r.patient_id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-900">{r.patient_name}</td>
                  <td className="px-5 py-3 text-gray-600">
                    {new Date(r.visit_date).toLocaleDateString('en-US', { dateStyle: 'medium' })}
                  </td>
                  <td className="px-5 py-3 text-gray-600">{r.diagnosis || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
