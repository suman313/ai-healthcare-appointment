'use client'
import { useState, useEffect } from 'react'
import api from '../services/api'
import { getUser } from '../lib/auth'
import { printPrescription } from '../lib/printPrescription'

const TABS = ['SOAP Notes', 'Prescriptions', 'History']

export default function VisitPanel({ appointment, onClose }) {
  const user = getUser()
  const [tab, setTab] = useState('SOAP Notes')
  const [soap, setSoap] = useState({ subjective: '', objective: '', assessment: '', plan: '', diagnosis: '' })
  const [existingRecord, setExistingRecord] = useState(null)
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')

  // Prescription state
  const [medications, setMedications] = useState([{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }])
  const [rxNotes, setRxNotes] = useState('')
  const [savingRx, setSavingRx] = useState(false)
  const [rxMsg, setRxMsg] = useState('')
  const [lastRxId, setLastRxId] = useState(null)
  const [printingRx, setPrintingRx] = useState(false)
  const [savedPrescriptions, setSavedPrescriptions] = useState([])
  const [printingId, setPrintingId] = useState(null)

  // History
  const [history, setHistory] = useState([])

  async function loadPrescriptions() {
    try {
      const res = await api.get(`/api/prescriptions/patient/${appointment.patient_id}`)
      setSavedPrescriptions(res.data)
    } catch {}
  }

  useEffect(() => {
    // Load existing medical record for this appointment
    api.get(`/api/medical-records/patient/${appointment.patient_id}`)
      .then((res) => {
        const forThisAppt = res.data.find((r) => r.appointment_id === appointment.id)
        if (forThisAppt) {
          setExistingRecord(forThisAppt)
          setSoap({
            subjective: forThisAppt.subjective || '',
            objective: forThisAppt.objective || '',
            assessment: forThisAppt.assessment || '',
            plan: forThisAppt.plan || '',
            diagnosis: forThisAppt.diagnosis || '',
          })
        }
        setHistory(res.data)
      })
      .catch(() => {})

    loadPrescriptions()
  }, [appointment])

  async function handlePrintSaved(id) {
    setPrintingId(id)
    try {
      const res = await api.get(`/api/prescriptions/${id}`)
      printPrescription(res.data)
    } catch {}
    setPrintingId(null)
  }

  async function saveSoap() {
    setSaving(true)
    setSavedMsg('')
    try {
      if (existingRecord) {
        await api.put(`/api/medical-records/${existingRecord.id}`, soap)
      } else {
        const res = await api.post('/api/medical-records', {
          ...soap,
          appointment_id: appointment.id,
          patient_id: appointment.patient_id,
          doctor_id: appointment.doctor_id,
          visit_date: appointment.appointment_time,
        })
        setExistingRecord(res.data)
      }
      setSavedMsg('Saved')
      setTimeout(() => setSavedMsg(''), 2000)
    } catch {}
    setSaving(false)
  }

  async function addMedication() {
    setMedications((prev) => [...prev, { name: '', dosage: '', frequency: '', duration: '', instructions: '' }])
  }

  function updateMed(index, field, value) {
    setMedications((prev) => prev.map((m, i) => i === index ? { ...m, [field]: value } : m))
  }

  function removeMed(index) {
    setMedications((prev) => prev.filter((_, i) => i !== index))
  }

  async function savePrescription() {
    setSavingRx(true)
    setRxMsg('')
    try {
      const res = await api.post('/api/prescriptions', {
        patient_id: appointment.patient_id,
        doctor_id: appointment.doctor_id,
        medical_record_id: existingRecord?.id || null,
        medications: medications.filter((m) => m.name.trim()),
        notes: rxNotes,
      })
      setLastRxId(res.data.id)
      setMedications([{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }])
      setRxNotes('')
      setRxMsg('Prescription saved')
      loadPrescriptions()
    } catch {}
    setSavingRx(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Overlay */}
      <div className="flex-1 bg-black/40" onClick={onClose} />

      {/* Panel */}
      <div className="w-full max-w-2xl bg-white h-full overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{appointment.patient_name}</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {new Date(appointment.appointment_time).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
            </p>
            {appointment.symptoms && (
              <p className="text-sm text-blue-600 mt-1 italic">"{appointment.symptoms}"</p>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-6">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex-1 p-6">
          {/* SOAP Notes Tab */}
          {tab === 'SOAP Notes' && (
            <div className="space-y-4">
              {[
                { key: 'subjective', label: 'S — Subjective', placeholder: "Patient's complaints, symptoms, history…" },
                { key: 'objective', label: 'O — Objective', placeholder: 'Examination findings, vitals, test results…' },
                { key: 'assessment', label: 'A — Assessment', placeholder: 'Diagnosis, differential…' },
                { key: 'plan', label: 'P — Plan', placeholder: 'Treatment plan, follow-up, referrals…' },
                { key: 'diagnosis', label: 'Diagnosis (ICD)', placeholder: 'e.g. J06.9 Acute upper respiratory infection' },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</label>
                  <textarea
                    value={soap[key]}
                    onChange={(e) => setSoap((prev) => ({ ...prev, [key]: e.target.value }))}
                    rows={key === 'diagnosis' ? 1 : 3}
                    placeholder={placeholder}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
              ))}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={saveSoap}
                  disabled={saving}
                  className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Saving…' : 'Save Notes'}
                </button>
                {savedMsg && <span className="text-sm text-green-600">{savedMsg}</span>}
              </div>
            </div>
          )}

          {/* Prescriptions Tab */}
          {tab === 'Prescriptions' && (
            <div className="space-y-5">

              {/* Saved prescriptions for this patient */}
              {savedPrescriptions.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Issued Prescriptions</p>
                  <div className="space-y-2">
                    {savedPrescriptions.map((rx) => {
                      const meds = Array.isArray(rx.medications) ? rx.medications : JSON.parse(rx.medications || '[]')
                      return (
                        <div key={rx.id} className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {new Date(rx.issued_at).toLocaleDateString('en-US', { dateStyle: 'medium' })}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {meds.map((m) => m.name).filter(Boolean).join(', ') || 'No medications'}
                            </p>
                          </div>
                          <button
                            onClick={() => handlePrintSaved(rx.id)}
                            disabled={printingId === rx.id}
                            className="text-xs text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
                          >
                            {printingId === rx.id ? 'Loading…' : 'Print PDF'}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                  <div className="border-t border-gray-200 my-4" />
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">New Prescription</p>
                </div>
              )}

              <div className="space-y-3">
                {medications.map((med, i) => (
                  <div key={i} className="border border-gray-200 rounded-xl p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Medication {i + 1}</p>
                      {medications.length > 1 && (
                        <button onClick={() => removeMed(i)} className="text-xs text-red-500 hover:text-red-700">Remove</button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { field: 'name', label: 'Drug Name', placeholder: 'e.g. Amoxicillin' },
                        { field: 'dosage', label: 'Dosage', placeholder: 'e.g. 500mg' },
                        { field: 'frequency', label: 'Frequency', placeholder: 'e.g. 3x daily' },
                        { field: 'duration', label: 'Duration', placeholder: 'e.g. 7 days' },
                      ].map(({ field, label, placeholder }) => (
                        <div key={field}>
                          <label className="block text-xs text-gray-500 mb-1">{label}</label>
                          <input
                            type="text"
                            value={med[field]}
                            onChange={(e) => updateMed(i, field, e.target.value)}
                            placeholder={placeholder}
                            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      ))}
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Special Instructions</label>
                      <input
                        type="text"
                        value={med.instructions}
                        onChange={(e) => updateMed(i, 'instructions', e.target.value)}
                        placeholder="e.g. Take after meals"
                        className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={addMedication}
                className="w-full border-2 border-dashed border-gray-200 text-gray-500 py-2.5 rounded-xl text-sm hover:border-blue-300 hover:text-blue-600 transition-colors"
              >
                + Add Another Medication
              </button>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Notes</label>
                <textarea
                  value={rxNotes}
                  onChange={(e) => setRxNotes(e.target.value)}
                  rows={2}
                  placeholder="Additional notes for the patient…"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={savePrescription}
                  disabled={savingRx}
                  className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {savingRx ? 'Saving…' : 'Issue Prescription'}
                </button>
                {lastRxId && (
                  <button
                    onClick={async () => {
                      setPrintingRx(true)
                      try {
                        const res = await api.get(`/api/prescriptions/${lastRxId}`)
                        printPrescription(res.data)
                      } catch {}
                      setPrintingRx(false)
                    }}
                    disabled={printingRx}
                    className="border border-blue-600 text-blue-600 px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-50 disabled:opacity-50"
                  >
                    {printingRx ? 'Loading…' : 'Print PDF'}
                  </button>
                )}
                {rxMsg && <span className="text-sm text-green-600">{rxMsg}</span>}
              </div>
            </div>
          )}

          {/* History Tab */}
          {tab === 'History' && (
            <div className="space-y-4">
              {history.length === 0 ? (
                <p className="text-gray-400 text-sm">No previous visit records.</p>
              ) : (
                history.map((r) => (
                  <div key={r.id} className="border border-gray-200 rounded-xl p-4">
                    <div className="flex justify-between mb-2">
                      <p className="text-sm font-semibold text-gray-900">
                        {new Date(r.visit_date).toLocaleDateString('en-US', { dateStyle: 'medium' })}
                      </p>
                      {r.diagnosis && (
                        <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">{r.diagnosis}</span>
                      )}
                    </div>
                    {r.subjective && <p className="text-xs text-gray-600 mb-1"><span className="font-medium">S:</span> {r.subjective}</p>}
                    {r.assessment && <p className="text-xs text-gray-600 mb-1"><span className="font-medium">A:</span> {r.assessment}</p>}
                    {r.plan && <p className="text-xs text-gray-600"><span className="font-medium">P:</span> {r.plan}</p>}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
