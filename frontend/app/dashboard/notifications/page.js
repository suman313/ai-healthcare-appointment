'use client'
import { useState, useEffect } from 'react'
import api from '../../../services/api'

const TYPE_LABELS = {
  appointment_confirmation: 'Confirmation',
  appointment_reminder: 'Reminder',
  cancellation: 'Cancellation',
  sms_confirmation: 'Confirmation',
  sms_reminder: 'Reminder',
  sms_cancellation: 'Cancellation',
  wa_confirmation: 'Confirmation',
  wa_reminder: 'Reminder',
  wa_cancellation: 'Cancellation',
}

const TYPE_COLORS = {
  appointment_confirmation: 'bg-green-100 text-green-700',
  appointment_reminder: 'bg-yellow-100 text-yellow-700',
  cancellation: 'bg-red-100 text-red-700',
  sms_confirmation: 'bg-green-100 text-green-700',
  sms_reminder: 'bg-yellow-100 text-yellow-700',
  sms_cancellation: 'bg-red-100 text-red-700',
  wa_confirmation: 'bg-green-100 text-green-700',
  wa_reminder: 'bg-yellow-100 text-yellow-700',
  wa_cancellation: 'bg-red-100 text-red-700',
}

function getChannel(type) {
  if (type?.startsWith('wa_')) return { label: 'WhatsApp', color: 'bg-emerald-100 text-emerald-700' }
  if (type?.startsWith('sms_')) return { label: 'SMS', color: 'bg-blue-100 text-blue-700' }
  return { label: 'Email', color: 'bg-purple-100 text-purple-700' }
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/notifications')
      .then((res) => setNotifications(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Notification Log</h1>
        <p className="text-sm text-gray-500 mt-0.5">All emails sent to patients</p>
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm">Loading…</p>
      ) : notifications.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-400">No notifications sent yet.</p>
          <p className="text-gray-400 text-sm mt-1">Emails are sent automatically when appointments are booked or cancelled.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr className="text-left text-gray-500">
                <th className="px-5 py-3 font-medium">Patient</th>
                <th className="px-5 py-3 font-medium">Contact</th>
                <th className="px-5 py-3 font-medium">Channel</th>
                <th className="px-5 py-3 font-medium">Type</th>
                <th className="px-5 py-3 font-medium">Message</th>
                <th className="px-5 py-3 font-medium">Sent At</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {notifications.map((n) => (
                <tr key={n.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-900">{n.patient_name || '—'}</td>
                  <td className="px-5 py-3 text-gray-500 text-xs">{n.patient_email || '—'}</td>
                  <td className="px-5 py-3">
                    {(() => {
                      const ch = getChannel(n.type)
                      return (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ch.color}`}>
                          {ch.label}
                        </span>
                      )
                    })()}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[n.type] || 'bg-gray-100 text-gray-600'}`}>
                      {TYPE_LABELS[n.type] || n.type}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-600 max-w-xs truncate">{n.message}</td>
                  <td className="px-5 py-3 text-gray-500 text-xs">{new Date(n.sent_at).toLocaleString()}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${n.status === 'sent' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {n.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
