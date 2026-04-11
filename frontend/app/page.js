import Link from 'next/link'

const features = [
  { icon: '🤖', title: 'AI Symptom Check', desc: 'Patients describe symptoms and get matched to the right specialist.' },
  { icon: '📅', title: 'Smart Scheduling', desc: 'Auto-generate available slots based on doctor availability.' },
  { icon: '🏥', title: 'Multi-Clinic', desc: 'Each clinic manages its own doctors, patients, and data securely.' },
  { icon: '🔔', title: 'Reminders', desc: 'Automatic appointment reminders reduce no-shows.' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Navbar */}
      <header className="flex items-center justify-between px-8 py-5 max-w-6xl mx-auto">
        <span className="text-2xl font-bold text-blue-600">MediBook</span>
        <div className="flex items-center gap-4">
          <Link href="/booking" className="text-sm text-gray-600 hover:text-blue-600">
            Book Appointment
          </Link>
          <Link
            href="/login"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Clinic Login
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="max-w-6xl mx-auto px-8 py-20 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
          AI-Powered Healthcare<br />Appointment Management
        </h1>
        <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto">
          Help patients find the right doctor using AI symptom analysis. Streamline clinic scheduling in one platform.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/booking"
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors text-lg"
          >
            Book an Appointment
          </Link>
          <Link
            href="/login"
            className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors text-lg"
          >
            Clinic Dashboard
          </Link>
        </div>
      </main>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-8 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map(({ icon, title, desc }) => (
            <div key={title} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="text-3xl mb-3">{icon}</div>
              <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
              <p className="text-sm text-gray-500">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="text-center py-6 text-sm text-gray-400 border-t border-gray-100">
        <p>AI assistant does not provide medical diagnosis. Always consult a qualified physician.</p>
      </footer>
    </div>
  )
}
