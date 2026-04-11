'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import axios from 'axios'
import { setToken, setUser } from '../../lib/auth'

export default function LoginPage() {
  const router = useRouter()
  const [tab, setTab] = useState('login') // 'login' | 'register'
  const [form, setForm] = useState({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/auth/login`,
        { email: form.email, password: form.password }
      )
      setToken(res.data.token)
      setUser(res.data.user)
      router.push('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleRegister(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/auth/register-clinic`,
        {
          clinicName: form.clinicName,
          address: form.address,
          phone: form.phone,
          email: form.clinicEmail,
          adminName: form.adminName,
          adminEmail: form.adminEmail,
          adminPassword: form.adminPassword,
        }
      )
      setToken(res.data.token)
      setUser(res.data.user)
      router.push('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 w-full max-w-md p-8">
        <div className="text-center mb-6">
          <Link href="/" className="text-2xl font-bold text-blue-600">MediBook</Link>
          <p className="text-sm text-gray-500 mt-1">Clinic Management Platform</p>
        </div>

        {/* Tabs */}
        <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
          {['login', 'register'].map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setError('') }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                tab === t ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'
              }`}
            >
              {t === 'login' ? 'Sign In' : 'Register Clinic'}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">
            {error}
          </div>
        )}

        {tab === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <Field label="Email" type="email" value={form.email || ''} onChange={update('email')} required />
            <Field label="Password" type="password" value={form.password || ''} onChange={update('password')} required />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Clinic Info</p>
            <Field label="Clinic Name" value={form.clinicName || ''} onChange={update('clinicName')} required />
            <Field label="Address" value={form.address || ''} onChange={update('address')} />
            <Field label="Phone" value={form.phone || ''} onChange={update('phone')} />
            <Field label="Clinic Email" type="email" value={form.clinicEmail || ''} onChange={update('clinicEmail')} />
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide pt-2">Admin Account</p>
            <Field label="Your Name" value={form.adminName || ''} onChange={update('adminName')} required />
            <Field label="Admin Email" type="email" value={form.adminEmail || ''} onChange={update('adminEmail')} required />
            <Field label="Password" type="password" value={form.adminPassword || ''} onChange={update('adminPassword')} required />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Creating account…' : 'Create Clinic Account'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

function Field({ label, ...props }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        {...props}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>
  )
}
