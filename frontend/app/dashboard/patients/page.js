'use client'
import { useState, useEffect } from 'react'
import api from '../../../services/api'
import Modal from '../../../components/Modal'

const EMPTY = { name: '', phone: '', email: '', date_of_birth: '' }

export default function PatientsPage() {
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [historyPatient, setHistoryPatient] = useState(null)
  const [history, setHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)

  async function openHistory(patient) {
    setHistoryPatient(patient)
    setHistoryLoading(true)
    setHistory([])
    try {
      const res = await api.get(`/api/medical-records/patient/${patient.id}`)
      setHistory(res.data)
    } catch {}
    setHistoryLoading(false)
  }

  async function load() {
    setLoading(true)
    try {
      const res = await api.get('/api/patients')
      setPatients(res.data)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await api.post('/api/patients', { ...form, date_of_birth: form.date_of_birth || null })
      setModal(false)
      setForm(EMPTY)
      load()
    } catch (err) {
      setError(err.response?.data?.error || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Patients</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage registered patients</p>
        </div>
        <button
          onClick={() => { setForm(EMPTY); setError(''); setModal(true) }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          + Add Patient
        </button>
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm">Loading…</p>
      ) : patients.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-400 mb-4">No patients yet.</p>
          <button onClick={() => setModal(true)} className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
            Add First Patient
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr className="text-left text-gray-500">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Phone</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Date of Birth</th>
                <th className="px-5 py-3 font-medium">Registered</th>
                <th className="px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {patients.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-900">{p.name}</td>
                  <td className="px-5 py-3 text-gray-600">{p.phone || '—'}</td>
                  <td className="px-5 py-3 text-gray-600">{p.email || '—'}</td>
                  <td className="px-5 py-3 text-gray-600">{p.date_of_birth ? new Date(p.date_of_birth).toLocaleDateString() : '—'}</td>
                  <td className="px-5 py-3 text-gray-400">{new Date(p.created_at).toLocaleDateString()}</td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => openHistory(p)}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      View History
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Patient History Panel */}
      {historyPatient && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40" onClick={() => setHistoryPatient(null)} />
          <div className="w-full max-w-xl bg-white h-full overflow-y-auto shadow-2xl flex flex-col">
            <div className="p-6 border-b border-gray-200 flex items-start justify-between shrink-0">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{historyPatient.name}</h2>
                <p className="text-sm text-gray-500 mt-0.5">Visit History</p>
              </div>
              <button onClick={() => setHistoryPatient(null)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <div className="flex-1 p-6">
              {historyLoading ? (
                <p className="text-gray-400 text-sm">Loading…</p>
              ) : history.length === 0 ? (
                <p className="text-gray-400 text-sm">No visit records for this patient.</p>
              ) : (
                <div className="space-y-4">
                  {history.map((r) => (
                    <div key={r.id} className="border border-gray-200 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-semibold text-gray-900">
                          {new Date(r.visit_date).toLocaleDateString('en-US', { dateStyle: 'medium' })}
                        </p>
                        <div className="flex items-center gap-2">
                          {r.diagnosis && (
                            <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">{r.diagnosis}</span>
                          )}
                          <span className="text-xs text-gray-400">Dr. {r.doctor_name}</span>
                        </div>
                      </div>
                      {r.subjective && <p className="text-xs text-gray-600 mb-1"><span className="font-medium">S:</span> {r.subjective}</p>}
                      {r.objective && <p className="text-xs text-gray-600 mb-1"><span className="font-medium">O:</span> {r.objective}</p>}
                      {r.assessment && <p className="text-xs text-gray-600 mb-1"><span className="font-medium">A:</span> {r.assessment}</p>}
                      {r.plan && <p className="text-xs text-gray-600"><span className="font-medium">P:</span> {r.plan}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <Modal isOpen={modal} onClose={() => setModal(false)} title="Add Patient">
        <form onSubmit={handleSave} className="space-y-4">
          {[
            { label: 'Full Name', field: 'name', required: true },
            { label: 'Phone', field: 'phone' },
            { label: 'Email', field: 'email', type: 'email' },
            { label: 'Date of Birth', field: 'date_of_birth', type: 'date' },
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
            <button type="button" onClick={() => setModal(false)} className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Saving…' : 'Add Patient'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
