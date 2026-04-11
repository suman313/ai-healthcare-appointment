'use client'
import { useState, useEffect } from 'react'
import api from '../../../services/api'
import Modal from '../../../components/Modal'

const STATUS_COLORS = {
  paid: 'bg-green-50 text-green-700',
  unpaid: 'bg-yellow-50 text-yellow-700',
  waived: 'bg-gray-50 text-gray-500',
}

export default function BillingPage() {
  const [records, setRecords] = useState([])
  const [stats, setStats] = useState(null)
  const [monthly, setMonthly] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [patients, setPatients] = useState([])
  const [appointments, setAppointments] = useState([])
  const [form, setForm] = useState({ patient_id: '', appointment_id: '', amount: '', status: 'unpaid', payment_method: '', notes: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')

  async function load() {
    try {
      const [billingRes, statsRes, monthlyRes, patientsRes, apptRes] = await Promise.all([
        api.get('/api/billing'),
        api.get('/api/billing/stats'),
        api.get('/api/billing/monthly-revenue'),
        api.get('/api/patients'),
        api.get('/api/appointments'),
      ])
      setRecords(billingRes.data)
      setStats(statsRes.data)
      setMonthly(monthlyRes.data)
      setPatients(patientsRes.data)
      setAppointments(apptRes.data)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function openAdd() {
    setForm({ patient_id: '', appointment_id: '', amount: '', status: 'unpaid', payment_method: '', notes: '' })
    setError('')
    setModal({ mode: 'add' })
  }

  function openEdit(record) {
    setForm({
      patient_id: record.patient_id,
      appointment_id: record.appointment_id || '',
      amount: record.amount,
      status: record.status,
      payment_method: record.payment_method || '',
      notes: record.notes || '',
    })
    setError('')
    setModal({ mode: 'edit', record })
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (modal.mode === 'add') {
        await api.post('/api/billing', { ...form, amount: Number(form.amount) })
      } else {
        await api.put(`/api/billing/${modal.record.id}`, { ...form, amount: Number(form.amount) })
      }
      setModal(null)
      load()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save.')
    }
    setSaving(false)
  }

  async function markPaid(record) {
    try {
      await api.put(`/api/billing/${record.id}`, {
        amount: record.amount,
        status: 'paid',
        payment_method: record.payment_method,
        notes: record.notes,
      })
      load()
    } catch {}
  }

  const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`
  const maxRevenue = monthly.length ? Math.max(...monthly.map((m) => parseFloat(m.revenue))) : 1

  const statCards = stats ? [
    { label: 'Revenue This Month', value: fmt(stats.revenue_this_month), color: 'text-green-700' },
    { label: 'Total Billed',       value: fmt(stats.total_billed),       color: 'text-blue-700'  },
    { label: 'Outstanding',        value: fmt(stats.total_outstanding),  color: 'text-yellow-700'},
    { label: 'Total Invoices',     value: stats.total_invoices,          color: 'text-gray-700'  },
  ] : []

  const filtered = filter === 'all' ? records : records.filter((r) => r.status === filter)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Billing & Revenue</h1>
        <button onClick={openAdd} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
          + New Invoice
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {statCards.map(({ label, value, color }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-xl p-5">
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Monthly Revenue Chart */}
      {monthly.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Revenue — Last 6 Months</h2>
          <div className="flex items-end gap-3 h-32">
            {monthly.map((m) => {
              const height = Math.max(8, (parseFloat(m.revenue) / maxRevenue) * 100)
              return (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs text-gray-500 font-medium">{fmt(m.revenue)}</span>
                  <div className="w-full bg-blue-500 rounded-t-md" style={{ height: `${height}%` }} />
                  <span className="text-xs text-gray-400">{m.month}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4">
        {['all', 'unpaid', 'paid', 'waived'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
              filter === f ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm">Loading…</p>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <p className="text-gray-400">No billing records yet.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left text-gray-400 border-b border-gray-200">
                <th className="px-5 py-3 font-medium">Patient</th>
                <th className="px-5 py-3 font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Method</th>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Paid At</th>
                <th className="px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-900">{r.patient_name}</td>
                  <td className="px-5 py-3 text-gray-900 font-semibold">{fmt(r.amount)}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[r.status]}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-500 capitalize">{r.payment_method || '—'}</td>
                  <td className="px-5 py-3 text-gray-500">
                    {new Date(r.created_at).toLocaleDateString('en-US', { dateStyle: 'medium' })}
                  </td>
                  <td className="px-5 py-3 text-gray-500">
                    {r.paid_at ? new Date(r.paid_at).toLocaleDateString('en-US', { dateStyle: 'medium' }) : '—'}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex gap-3">
                      {r.status === 'unpaid' && (
                        <button
                          onClick={() => markPaid(r)}
                          className="text-xs text-green-600 hover:text-green-700 font-medium"
                        >
                          Mark Paid
                        </button>
                      )}
                      <button onClick={() => openEdit(r)} className="text-xs text-blue-600 hover:text-blue-700">
                        Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        isOpen={!!modal}
        onClose={() => setModal(null)}
        title={modal?.mode === 'add' ? 'New Invoice' : 'Edit Invoice'}
        size="lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Patient *</label>
            <select
              value={form.patient_id}
              onChange={(e) => setForm((p) => ({ ...p, patient_id: e.target.value }))}
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select patient</option>
              {patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Appointment (optional)</label>
            <select
              value={form.appointment_id}
              onChange={(e) => setForm((p) => ({ ...p, appointment_id: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">None</option>
              {appointments
                .filter((a) => !form.patient_id || a.patient_id === Number(form.patient_id))
                .map((a) => (
                  <option key={a.id} value={a.id}>
                    {new Date(a.appointment_time).toLocaleDateString()} — {a.doctor_name}
                  </option>
                ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.amount}
                onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="unpaid">Unpaid</option>
                <option value="paid">Paid</option>
                <option value="waived">Waived</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
            <select
              value={form.payment_method}
              onChange={(e) => setForm((p) => ({ ...p, payment_method: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">—</option>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="insurance">Insurance</option>
              <option value="transfer">Bank Transfer</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <input
              type="text"
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModal(null)} className="flex-1 border border-gray-200 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
