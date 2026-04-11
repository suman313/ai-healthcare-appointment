'use client'
import { useState, useEffect } from 'react'
import api from '../../../services/api'
import Modal from '../../../components/Modal'

const ROLE_LABELS = { doctor: 'Doctor', receptionist: 'Receptionist' }

export default function SettingsPage() {
  const [users, setUsers] = useState([])
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // 'add' | 'reset' | { type: 'delete', user }
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'receptionist', specialization: '', phone: '', doctor_id: '' })
  const [resetForm, setResetForm] = useState({ userId: null, password: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  async function load() {
    try {
      const [usersRes, docRes] = await Promise.all([api.get('/api/users'), api.get('/api/doctors')])
      setUsers(usersRes.data)
      setDoctors(docRes.data)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleAddUser(e) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      await api.post('/api/users', form)
      setModal(null)
      setForm({ name: '', email: '', password: '', role: 'receptionist', specialization: '', phone: '', doctor_id: '' })
      load()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create user.')
    }
    setSaving(false)
  }

  async function handleDelete(user) {
    try {
      await api.delete(`/api/users/${user.id}`)
      load()
    } catch {}
  }

  async function handleResetPassword(e) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      await api.post(`/api/users/${resetForm.userId}/reset-password`, { password: resetForm.password })
      setSuccessMsg('Password updated.')
      setModal(null)
      setTimeout(() => setSuccessMsg(''), 3000)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed.')
    }
    setSaving(false)
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Settings</h1>
      <p className="text-sm text-gray-500 mb-8">Manage clinic staff accounts.</p>

      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-2.5 rounded-lg mb-5">
          {successMsg}
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-900">Staff Accounts</h2>
        <button
          onClick={() => { setError(''); setModal('add') }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          + Add Staff
        </button>
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm">Loading…</p>
      ) : users.length === 0 ? (
        <p className="text-gray-400 text-sm">No staff accounts yet.</p>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left text-gray-400 border-b border-gray-200">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Role</th>
                <th className="px-5 py-3 font-medium">Created</th>
                <th className="px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-900">{u.name}</td>
                  <td className="px-5 py-3 text-gray-600">{u.email}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      u.role === 'admin' ? 'bg-purple-50 text-purple-700' :
                      u.role === 'doctor' ? 'bg-blue-50 text-blue-700' :
                      'bg-gray-50 text-gray-600'
                    }`}>
                      {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-500">
                    {new Date(u.created_at).toLocaleDateString('en-US', { dateStyle: 'medium' })}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex gap-3">
                      <button
                        onClick={() => { setError(''); setResetForm({ userId: u.id, password: '' }); setModal('reset') }}
                        className="text-xs text-blue-600 hover:text-blue-700"
                      >
                        Reset PW
                      </button>
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => handleDelete(u)}
                          className="text-xs text-red-500 hover:text-red-700"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Staff Modal */}
      <Modal isOpen={modal === 'add'} onClose={() => setModal(null)} title="Add Staff Account" size="lg">
        <form onSubmit={handleAddUser} className="space-y-5">
          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          {/* Row 1: Name + Email */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input
                type="text"
                list={form.role === 'doctor' ? 'doctor-names-list' : undefined}
                value={form.name}
                onChange={(e) => {
                  const val = e.target.value
                  const match = form.role === 'doctor' ? doctors.find((d) => d.name === val) : null
                  setForm((p) => ({ ...p, name: val, doctor_id: match ? String(match.id) : p.doctor_id, email: match ? match.email : p.email }))
                }}
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {form.role === 'doctor' && (
                <datalist id="doctor-names-list">
                  {doctors.map((d) => <option key={d.id} value={d.name} />)}
                </datalist>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input
                type="text"
                list={form.role === 'doctor' ? 'doctor-emails-list' : undefined}
                value={form.email}
                onChange={(e) => {
                  const val = e.target.value
                  const match = form.role === 'doctor' ? doctors.find((d) => d.email === val) : null
                  setForm((p) => ({ ...p, email: val, doctor_id: match ? String(match.id) : p.doctor_id, name: match ? match.name : p.name }))
                }}
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {form.role === 'doctor' && (
                <datalist id="doctor-emails-list">
                  {doctors.map((d) => <option key={d.id} value={d.email} />)}
                </datalist>
              )}
            </div>
          </div>

          {/* Row 2: Password + Role */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
              <input type="password" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
              <select value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value, specialization: '', phone: '', doctor_id: '' }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="receptionist">Receptionist</option>
                <option value="doctor">Doctor</option>
              </select>
            </div>
          </div>

          {/* Doctor-only fields */}
          {form.role === 'doctor' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Link to Existing Doctor Profile</label>
                <select
                  value={form.doctor_id}
                  onChange={(e) => {
                    const selected = doctors.find((d) => String(d.id) === e.target.value)
                    setForm((p) => ({
                      ...p,
                      doctor_id: e.target.value,
                      name: selected ? selected.name : '',
                      email: selected ? selected.email : '',
                      specialization: '',
                      phone: '',
                    }))
                  }}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Create new doctor profile --</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}{d.specialization ? ` — ${d.specialization}` : ''}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  {form.doctor_id ? 'Will link login to this existing doctor profile.' : 'No profile selected — a new doctor profile will be created.'}
                </p>
              </div>
              {!form.doctor_id && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
                    <input type="text" value={form.specialization} onChange={(e) => setForm((p) => ({ ...p, specialization: e.target.value }))}
                      placeholder="e.g. General Physician"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input type="tel" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
              )}
            </>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => setModal(null)} className="flex-1 border border-gray-200 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">{saving ? 'Creating…' : 'Create Account'}</button>
          </div>
        </form>
      </Modal>

      {/* Reset Password Modal */}
      <Modal isOpen={modal === 'reset'} onClose={() => setModal(null)} title="Reset Password">
        <form onSubmit={handleResetPassword} className="space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password *</label>
            <input type="password" value={resetForm.password} onChange={(e) => setResetForm((p) => ({ ...p, password: e.target.value }))} required minLength={6}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModal(null)} className="flex-1 border border-gray-200 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">{saving ? 'Saving…' : 'Update Password'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
