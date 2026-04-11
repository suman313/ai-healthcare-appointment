'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import axios from 'axios'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export default function DisplayScreen() {
  const { clinicId } = useParams()
  const [data, setData] = useState(null)
  const [time, setTime] = useState(new Date())

  async function load() {
    try {
      const res = await axios.get(`${API}/api/queue/display/${clinicId}`)
      setData(res.data)
    } catch {}
  }

  // Refresh queue every 5 seconds
  useEffect(() => {
    load()
    const queueInterval = setInterval(load, 5000)
    return () => clearInterval(queueInterval)
  }, [clinicId])

  // Update clock every second
  useEffect(() => {
    const clockInterval = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(clockInterval)
  }, [])

  const nowServing = data?.now_serving || []
  const waiting = data?.waiting || []
  const completed = data?.completed || []

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col p-8 select-none">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-white">MediBook</h1>
          <p className="text-gray-400 text-lg mt-1">Waiting Room Display</p>
        </div>
        <div className="text-right">
          <p className="text-5xl font-mono font-bold text-white">
            {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
          </p>
          <p className="text-gray-400 mt-1">
            {time.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Now Serving */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-400 uppercase tracking-widest mb-4">Now Serving</h2>
        {nowServing.length === 0 ? (
          <div className="bg-gray-800 rounded-2xl p-10 text-center">
            <p className="text-gray-500 text-2xl">No patients being called</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {nowServing.map((a) => (
              <div key={a.id} className="bg-green-500 rounded-2xl px-10 py-8 flex items-center justify-between animate-pulse">
                <div className="flex items-center gap-8">
                  <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center">
                    <span className="text-5xl font-black text-white">#{a.queue_number}</span>
                  </div>
                  <div>
                    <p className="text-4xl font-bold text-white">{a.patient_name}</p>
                    <p className="text-green-100 text-xl mt-1">Please proceed to the doctor's room</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-green-100 text-lg">Doctor</p>
                  <p className="text-white text-2xl font-bold">Dr. {a.doctor_name}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Waiting */}
      <div className="flex-1 grid grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold text-gray-400 uppercase tracking-widest mb-4">
            Waiting — {waiting.length} patient{waiting.length !== 1 ? 's' : ''}
          </h2>
          {waiting.length === 0 ? (
            <div className="bg-gray-800 rounded-2xl p-8 text-center">
              <p className="text-gray-500 text-lg">No patients waiting</p>
            </div>
          ) : (
            <div className="space-y-3">
              {waiting.map((a, idx) => (
                <div key={a.id} className={`rounded-xl px-6 py-4 flex items-center gap-4 ${idx === 0 ? 'bg-blue-700' : 'bg-gray-800'}`}>
                  <span className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-black ${idx === 0 ? 'bg-white text-blue-700' : 'bg-gray-700 text-white'}`}>
                    #{a.queue_number}
                  </span>
                  <div>
                    <p className="text-white text-xl font-semibold">{a.patient_name}</p>
                    <p className="text-gray-400 text-sm">Dr. {a.doctor_name}</p>
                  </div>
                  {idx === 0 && (
                    <span className="ml-auto bg-blue-500 text-white text-xs px-3 py-1 rounded-full font-medium">
                      Next
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Completed */}
        <div>
          <h2 className="text-xl font-semibold text-gray-400 uppercase tracking-widest mb-4">
            Completed — {completed.length}
          </h2>
          {completed.length === 0 ? (
            <div className="bg-gray-800 rounded-2xl p-8 text-center">
              <p className="text-gray-500 text-lg">None yet</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {completed.slice().reverse().map((a) => (
                <div key={a.id} className="bg-gray-800 rounded-xl px-6 py-4 flex items-center gap-4 opacity-60">
                  <span className="w-10 h-10 rounded-full bg-green-800 flex items-center justify-center text-sm font-bold text-green-300">
                    ✓
                  </span>
                  <div>
                    <p className="text-gray-300 text-lg">{a.patient_name}</p>
                    <p className="text-gray-500 text-sm">Dr. {a.doctor_name}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <p className="text-center text-gray-600 text-sm mt-6">Refreshes automatically every 5 seconds</p>
    </div>
  )
}
