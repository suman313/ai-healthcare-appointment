'use client'
import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { isAuthenticated, getUser } from '../../lib/auth'
import AdminSidebar from '../../components/AdminSidebar'
import ReceptionistSidebar from '../../components/ReceptionistSidebar'
import DoctorSidebar from '../../components/DoctorSidebar'

const ROLE_HOME = {
  admin: '/dashboard',
  receptionist: '/dashboard/receptionist',
  doctor: '/dashboard/doctor',
}

export default function DashboardLayout({ children }) {
  const router = useRouter()
  const pathname = usePathname()
  const user = getUser()

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/login')
      return
    }

    const role = user?.role
    const home = ROLE_HOME[role]

    // Redirect to role home if on wrong portal root
    if (home && pathname === '/dashboard' && role !== 'admin') {
      router.replace(home)
    }
  }, [router, pathname, user])

  if (!isAuthenticated()) return null

  const role = user?.role

  const SidebarComponent =
    role === 'receptionist' ? ReceptionistSidebar :
    role === 'doctor' ? DoctorSidebar :
    AdminSidebar

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarComponent />
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  )
}
