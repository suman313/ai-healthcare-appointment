'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { clearAuth, getUser } from '../lib/auth'

const navItems = [
  { href: '/dashboard/receptionist', label: "Today's Queue", icon: '🏥', exact: true },
  { href: '/dashboard/receptionist/book', label: 'Book Appointment', icon: '📅' },
  { href: '/dashboard/receptionist/patients', label: 'Patients', icon: '🧑‍🤝‍🧑' },
]

export default function ReceptionistSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const user = getUser()

  function handleLogout() {
    clearAuth()
    router.push('/login')
  }

  return (
    <aside className="w-56 min-h-screen bg-white border-r border-gray-200 flex flex-col">
      <div className="p-5 border-b border-gray-200">
        <span className="text-lg font-bold text-blue-600">MediBook</span>
        <p className="text-xs text-gray-400 mt-0.5 font-medium uppercase tracking-wide">Reception</p>
        {user && <p className="text-xs text-gray-500 mt-1 truncate">{user.name}</p>}
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(({ href, label, icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                active ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span>{icon}</span>
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="p-3 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg transition-colors"
        >
          Sign out
        </button>
      </div>
    </aside>
  )
}
