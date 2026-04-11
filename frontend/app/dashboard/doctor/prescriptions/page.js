'use client'
import { useState, useEffect } from 'react'
import api from '../../../../services/api'
import { getUser } from '../../../../lib/auth'
import { printPrescription } from '../../../../lib/printPrescription'

export default function DoctorPrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)
  const [printing, setPrinting] = useState(null)
  const user = getUser()

  async function handlePrint(id) {
    setPrinting(id)
    try {
      const res = await api.get(`/api/prescriptions/${id}`)
      printPrescription(res.data)
    } catch {}
    setPrinting(null)
  }

  useEffect(() => {
    async function load() {
      try {
        if (!user?.doctor_id) return
        const res = await api.get(`/api/prescriptions/doctor/${user.doctor_id}`)
        setPrescriptions(res.data)
      } catch {}
      setLoading(false)
    }
    load()
  }, [user])

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Prescriptions</h1>

      {loading ? (
        <p className="text-gray-400 text-sm">Loading…</p>
      ) : prescriptions.length === 0 ? (
        <p className="text-gray-400 text-sm">No prescriptions issued yet.</p>
      ) : (
        <div className="space-y-3">
          {prescriptions.map((rx) => (
            <div key={rx.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setExpanded(expanded === rx.id ? null : rx.id)}
                className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4 text-left">
                  <div className="w-9 h-9 bg-purple-50 rounded-full flex items-center justify-center text-purple-600 font-bold text-sm">
                    {rx.patient_name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{rx.patient_name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {new Date(rx.issued_at).toLocaleDateString('en-US', { dateStyle: 'medium' })}
                      {' · '}
                      {Array.isArray(rx.medications) ? rx.medications.length : JSON.parse(rx.medications || '[]').length} medication(s)
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={(e) => { e.stopPropagation(); handlePrint(rx.id) }}
                    disabled={printing === rx.id}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
                  >
                    {printing === rx.id ? 'Loading…' : 'Print PDF'}
                  </button>
                  <span className="text-gray-400 text-xs">{expanded === rx.id ? '▲' : '▼'}</span>
                </div>
              </button>

              {expanded === rx.id && (
                <div className="border-t border-gray-100 p-5">
                  <div className="space-y-3 mb-4">
                    {(Array.isArray(rx.medications) ? rx.medications : JSON.parse(rx.medications || '[]')).map((med, i) => (
                      <div key={i} className="bg-gray-50 rounded-lg p-3">
                        <p className="font-semibold text-sm text-gray-900">{med.name} <span className="font-normal text-gray-500">— {med.dosage}</span></p>
                        <p className="text-xs text-gray-600 mt-1">{med.frequency} · {med.duration}</p>
                        {med.instructions && <p className="text-xs text-blue-600 mt-0.5">{med.instructions}</p>}
                      </div>
                    ))}
                  </div>
                  {rx.notes && (
                    <p className="text-xs text-gray-500 border-t border-gray-100 pt-3">
                      <span className="font-medium">Notes:</span> {rx.notes}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
