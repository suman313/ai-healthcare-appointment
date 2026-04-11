'use client'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'

function ConfirmationContent() {
  const params = useSearchParams()
  const doctor = params.get('doctor') || ''
  const time = params.get('time') || ''
  const patientName = params.get('patient') || ''
  const id = params.get('id') || ''

  const formatted = time
    ? new Date(time).toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })
    : ''

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-white px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 w-full max-w-md p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <span className="text-3xl">✓</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Appointment Confirmed!</h1>
        <p className="text-gray-500 mb-6">Your appointment has been successfully booked.</p>

        <div className="bg-gray-50 rounded-xl p-5 text-left space-y-3 text-sm mb-6">
          {id && <Row label="Booking #" value={`APT-${id}`} />}
          {patientName && <Row label="Patient" value={patientName} />}
          {doctor && <Row label="Doctor" value={doctor} />}
          {formatted && <Row label="Date & Time" value={formatted} />}
        </div>

        <p className="text-xs text-gray-400 mb-6">
          You will receive a reminder 24 hours before your appointment.
        </p>

        <div className="flex gap-3 justify-center">
          <Link
            href="/booking"
            className="border border-gray-300 text-gray-700 px-5 py-2 rounded-lg text-sm hover:bg-gray-50"
          >
            Book Another
          </Link>
          <Link
            href="/"
            className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  )
}

export default function ConfirmationPage() {
  return (
    <Suspense>
      <ConfirmationContent />
    </Suspense>
  )
}
