import Link from 'next/link'

export default function BookingIndexPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white px-4">
      <div className="text-center max-w-md">
        <Link href="/" className="text-2xl font-bold text-blue-600">MediBook</Link>
        <p className="mt-6 text-lg font-semibold text-gray-800">No clinic selected</p>
        <p className="mt-2 text-gray-500 text-sm">
          To book an appointment, please use the booking link provided by your clinic.
          It looks like: <span className="font-mono text-blue-600">/booking/[clinic-id]</span>
        </p>
        <Link href="/" className="mt-6 inline-block text-sm text-blue-600 hover:underline">
          Back to home
        </Link>
      </div>
    </div>
  )
}
