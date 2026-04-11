'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import api from '../../../services/api'

const STEPS = ['Symptoms', 'Doctor', 'Time Slot', 'Your Details', 'Confirm']

export default function BookingPage() {
  const router = useRouter()
  const { clinicId } = useParams()

  const [clinic, setClinic] = useState(null)
  const [clinicError, setClinicError] = useState(false)

  // AI step
  const [symptoms, setSymptoms] = useState('')
  const [aiResult, setAiResult] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)

  // Doctor step
  const [doctors, setDoctors] = useState([])
  const [selectedDoctor, setSelectedDoctor] = useState(null)

  // Slot step
  const [date, setDate] = useState('')
  const [slots, setSlots] = useState([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState('')

  // Patient step
  const [patient, setPatient] = useState({ name: '', phone: '', email: '' })

  const [step, setStep] = useState(0)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    api.get(`/api/clinics/${clinicId}`)
      .then((r) => setClinic(r.data))
      .catch(() => setClinicError(true))

    api.get(`/api/doctors?clinic_id=${clinicId}`)
      .then((r) => setDoctors(r.data))
      .catch(() => {})
  }, [clinicId])

  async function runAiCheck() {
    if (!symptoms.trim()) return
    setAiLoading(true)
    try {
      const res = await api.post('/api/ai/symptom-check', { symptoms })
      setAiResult(res.data)
    } catch {
      setAiResult(null)
    } finally {
      setAiLoading(false)
    }
  }

  async function fetchSlots() {
    if (!selectedDoctor || !date) return
    setSlotsLoading(true)
    setSlots([])
    setSelectedSlot('')
    try {
      const res = await api.get(`/api/doctors/${selectedDoctor.id}/slots?date=${date}&clinic_id=${clinicId}`)
      setSlots(res.data.slots || [])
    } catch {
      setSlots([])
    } finally {
      setSlotsLoading(false)
    }
  }

  useEffect(() => {
    if (step === 2) fetchSlots()
  }, [step, date]) // eslint-disable-line

  async function submit() {
    setError('')
    setSubmitting(true)
    try {
      const patientRes = await api.post('/api/patients', {
        ...patient,
        date_of_birth: null,
        clinic_id: clinicId,
      })
      const appointmentTime = `${date}T${selectedSlot}:00`
      const apptRes = await api.post('/api/appointments', {
        doctor_id: selectedDoctor.id,
        patient_id: patientRes.data.id,
        appointment_time: appointmentTime,
        symptoms: symptoms || null,
        clinic_id: clinicId,
      })
      router.push(
        `/confirmation?id=${apptRes.data.id}&doctor=${encodeURIComponent(selectedDoctor.name)}&time=${encodeURIComponent(appointmentTime)}&patient=${encodeURIComponent(patient.name)}`
      )
    } catch (err) {
      setError(err.response?.data?.error || 'Booking failed')
      setSubmitting(false)
    }
  }

  const filteredDoctors = aiResult
    ? doctors
        .filter((d) =>
          d.specialization?.toLowerCase().includes(
            aiResult.recommended_specialist?.toLowerCase().split(' ')[0] || ''
          )
        )
        .concat(
          doctors.filter(
            (d) =>
              !d.specialization?.toLowerCase().includes(
                aiResult.recommended_specialist?.toLowerCase().split(' ')[0] || ''
              )
          )
        )
    : doctors

  if (clinicError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white">
        <div className="text-center">
          <p className="text-xl font-semibold text-gray-700 mb-2">Clinic not found</p>
          <p className="text-gray-400 text-sm mb-6">This booking link is invalid or the clinic no longer exists.</p>
          <Link href="/" className="text-blue-600 hover:underline text-sm">Back to home</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <header className="flex items-center justify-between px-8 py-5 max-w-4xl mx-auto">
        <Link href="/" className="text-xl font-bold text-blue-600">MediBook</Link>
        {clinic && <span className="text-sm text-gray-500">{clinic.name}</span>}
      </header>

      <main className="max-w-2xl mx-auto px-4 pb-20">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Book an Appointment</h1>
        <p className="text-gray-500 mb-8">Follow the steps below to schedule your visit.</p>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-10">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                i < step ? 'bg-blue-600 text-white' : i === step ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-400' : 'bg-gray-100 text-gray-400'
              }`}>
                {i < step ? '✓' : i + 1}
              </div>
              {i < STEPS.length - 1 && <div className={`h-0.5 w-6 ${i < step ? 'bg-blue-400' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        {/* Step 0: Symptoms */}
        {step === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-lg mb-1">Describe your symptoms</h2>
            <p className="text-sm text-gray-500 mb-4">Our AI will suggest the right specialist. You can skip this step.</p>
            <textarea
              className="w-full border border-gray-300 rounded-lg p-3 text-sm h-28 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. fever, headache, sore throat for 2 days..."
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={runAiCheck}
                disabled={!symptoms.trim() || aiLoading}
                className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {aiLoading ? 'Analyzing…' : 'Check Symptoms'}
              </button>
              <button
                onClick={() => setStep(1)}
                className="border border-gray-300 text-gray-600 px-5 py-2 rounded-lg text-sm hover:bg-gray-50"
              >
                Skip
              </button>
            </div>
            {aiResult && (
              <div className="mt-5 p-4 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-sm font-semibold text-blue-800 mb-1">AI Recommendation</p>
                <p className="text-sm text-blue-700">Specialist: <strong>{aiResult.recommended_specialist}</strong></p>
                <p className="text-sm text-blue-700">Urgency: <strong className={`${aiResult.urgency === 'high' ? 'text-red-600' : aiResult.urgency === 'medium' ? 'text-yellow-600' : 'text-green-600'}`}>{aiResult.urgency}</strong></p>
                <button onClick={() => setStep(1)} className="mt-3 bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
                  Find a Doctor →
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 1: Doctor */}
        {step === 1 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-lg mb-4">Select a Doctor</h2>
            {aiResult && (
              <p className="text-sm text-blue-600 mb-4">Suggested: <strong>{aiResult.recommended_specialist}</strong></p>
            )}
            <div className="space-y-3">
              {filteredDoctors.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => setSelectedDoctor(doc)}
                  className={`w-full text-left border rounded-lg p-4 transition-colors ${
                    selectedDoctor?.id === doc.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <p className="font-medium text-gray-900">{doc.name}</p>
                  <p className="text-sm text-gray-500">{doc.specialization || 'General Physician'}</p>
                </button>
              ))}
              {filteredDoctors.length === 0 && (
                <p className="text-gray-400 text-sm">No doctors available.</p>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setStep(0)} className="border border-gray-300 text-gray-600 px-5 py-2 rounded-lg text-sm hover:bg-gray-50">Back</button>
              <button
                onClick={() => setStep(2)}
                disabled={!selectedDoctor}
                className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Slot */}
        {step === 2 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-lg mb-4">Select a Time Slot</h2>
            <p className="text-sm text-gray-500 mb-4">Doctor: <strong>{selectedDoctor?.name}</strong></p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {date && (
                <button onClick={fetchSlots} className="ml-3 text-sm text-blue-600 hover:underline">Refresh slots</button>
              )}
            </div>
            {slotsLoading && <p className="text-sm text-gray-400">Loading slots…</p>}
            {!slotsLoading && date && slots.length === 0 && (
              <p className="text-sm text-gray-400">No available slots for this date.</p>
            )}
            {slots.length > 0 && (
              <div className="grid grid-cols-4 gap-2 mb-4">
                {slots.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedSlot(s)}
                    className={`py-2 rounded-lg text-sm font-medium border transition-colors ${
                      selectedSlot === s ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-700 hover:border-blue-400'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
            <div className="flex gap-3 mt-2">
              <button onClick={() => setStep(1)} className="border border-gray-300 text-gray-600 px-5 py-2 rounded-lg text-sm hover:bg-gray-50">Back</button>
              <button
                onClick={() => setStep(3)}
                disabled={!selectedSlot}
                className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Patient info */}
        {step === 3 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-lg mb-4">Patient Information</h2>
            <div className="space-y-4">
              {[
                { label: 'Full Name', field: 'name', required: true },
                { label: 'Phone', field: 'phone' },
                { label: 'Email', field: 'email', type: 'email' },
              ].map(({ label, field, type = 'text', required }) => (
                <div key={field}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <input
                    type={type}
                    required={required}
                    value={patient[field]}
                    onChange={(e) => setPatient((p) => ({ ...p, [field]: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setStep(2)} className="border border-gray-300 text-gray-600 px-5 py-2 rounded-lg text-sm hover:bg-gray-50">Back</button>
              <button
                onClick={() => setStep(4)}
                disabled={!patient.name}
                className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                Review →
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Confirm */}
        {step === 4 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-lg mb-5">Confirm Appointment</h2>
            <dl className="space-y-3 text-sm">
              <Row label="Clinic" value={clinic?.name} />
              <Row label="Patient" value={patient.name} />
              <Row label="Doctor" value={selectedDoctor?.name} />
              <Row label="Specialization" value={selectedDoctor?.specialization || 'General Physician'} />
              <Row label="Date" value={date} />
              <Row label="Time" value={selectedSlot} />
              {symptoms && <Row label="Symptoms" value={symptoms} />}
            </dl>
            {error && (
              <p className="mt-4 text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>
            )}
            <div className="flex gap-3 mt-6">
              <button onClick={() => setStep(3)} className="border border-gray-300 text-gray-600 px-5 py-2 rounded-lg text-sm hover:bg-gray-50">Back</button>
              <button
                onClick={submit}
                disabled={submitting}
                className="bg-green-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
              >
                {submitting ? 'Booking…' : 'Confirm Booking'}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between py-2 border-b border-gray-100">
      <dt className="text-gray-500">{label}</dt>
      <dd className="font-medium text-gray-900">{value}</dd>
    </div>
  )
}
