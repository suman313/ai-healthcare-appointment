'use client'
import { useState, useEffect } from 'react'
import api from '../../../services/api'

const PLAN_COLORS = {
  'Free': 'border-gray-200',
  'Basic': 'border-blue-400',
  'Professional': 'border-purple-500',
  'Clinic Chain': 'border-yellow-400',
}

const PLAN_BADGES = {
  'Free': 'bg-gray-100 text-gray-600',
  'Basic': 'bg-blue-100 text-blue-700',
  'Professional': 'bg-purple-100 text-purple-700',
  'Clinic Chain': 'bg-yellow-100 text-yellow-700',
}

export default function SubscriptionPage() {
  const [plans, setPlans] = useState([])
  const [current, setCurrent] = useState(null)
  const [usage, setUsage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [upgrading, setUpgrading] = useState(null)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    Promise.all([
      api.get('/api/subscriptions/plans'),
      api.get('/api/subscriptions/current'),
    ]).then(([plansRes, currentRes]) => {
      setPlans(plansRes.data)
      setCurrent(currentRes.data.subscription)
      setUsage(currentRes.data.usage)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  async function handleUpgrade(planId, planName) {
    if (!confirm(`Switch to the ${planName} plan?`)) return
    setUpgrading(planId)
    setMsg('')
    try {
      await api.post('/api/subscriptions/upgrade', { plan_id: planId })
      const res = await api.get('/api/subscriptions/current')
      setCurrent(res.data.subscription)
      setUsage(res.data.usage)
      setMsg(`Successfully switched to ${planName} plan.`)
    } catch (err) {
      setMsg(err.response?.data?.error || 'Upgrade failed')
    } finally {
      setUpgrading(null)
    }
  }

  function formatLimit(val) {
    return val === -1 ? 'Unlimited' : val
  }

  if (loading) return <p className="text-gray-400 text-sm">Loading…</p>

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Subscription</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage your plan and usage</p>
      </div>

      {msg && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm ${msg.includes('failed') || msg.includes('error') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
          {msg}
        </div>
      )}

      {/* Current Plan Summary */}
      {current && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-500">Current Plan</p>
              <div className="flex items-center gap-2 mt-1">
                <h2 className="text-xl font-bold text-gray-900">{current.plan_name}</h2>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PLAN_BADGES[current.plan_name] || 'bg-gray-100 text-gray-600'}`}>
                  Active
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">
                {current.price === 0 ? 'Free' : `₹${Number(current.price).toLocaleString('en-IN')}`}
              </p>
              {current.price > 0 && <p className="text-xs text-gray-400">per month</p>}
            </div>
          </div>

          {/* Usage bars */}
          {usage && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Appointments this month</span>
                  <span>{usage.appointments} / {formatLimit(current.max_appointments_per_month)}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{
                      width: current.max_appointments_per_month === -1 ? '20%'
                        : `${Math.min(100, (usage.appointments / current.max_appointments_per_month) * 100)}%`
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>SMS sent this month</span>
                  <span>{current.sms_enabled ? `${usage.sms} / ${formatLimit(current.max_sms_per_month)}` : 'Not included'}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  {current.sms_enabled && (
                    <div
                      className="h-full bg-green-500 rounded-full transition-all"
                      style={{
                        width: current.max_sms_per_month === -1 ? '20%'
                          : `${Math.min(100, (usage.sms / current.max_sms_per_month) * 100)}%`
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* All Plans */}
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Available Plans</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {plans.map((plan) => {
          const isCurrent = current?.plan_name === plan.name
          const features = Array.isArray(plan.features) ? plan.features : JSON.parse(plan.features || '[]')
          return (
            <div
              key={plan.id}
              className={`bg-white rounded-xl border-2 p-5 flex flex-col ${isCurrent ? 'border-blue-500 shadow-md' : PLAN_COLORS[plan.name] || 'border-gray-200'}`}
            >
              {isCurrent && (
                <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full self-start mb-2">Current Plan</span>
              )}
              <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
              <p className="text-2xl font-bold text-gray-900 mt-1 mb-3">
                {plan.price === 0 ? <span className="text-green-600">Free</span> : `₹${Number(plan.price).toLocaleString('en-IN')}`}
                {plan.price > 0 && <span className="text-sm font-normal text-gray-400">/mo</span>}
              </p>

              <ul className="space-y-1.5 flex-1 mb-4">
                {features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="text-green-500 mt-0.5">✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              <button
                disabled={isCurrent || upgrading === plan.id}
                onClick={() => handleUpgrade(plan.id, plan.name)}
                className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${
                  isCurrent
                    ? 'bg-gray-100 text-gray-400 cursor-default'
                    : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'
                }`}
              >
                {isCurrent ? 'Current Plan' : upgrading === plan.id ? 'Switching…' : plan.price === 0 ? 'Downgrade' : 'Upgrade'}
              </button>
            </div>
          )
        })}
      </div>

      <p className="text-xs text-gray-400 mt-6 text-center">
        This is a demo — no real payment is processed. In production, payment gateway will be integrated.
      </p>
    </div>
  )
}
