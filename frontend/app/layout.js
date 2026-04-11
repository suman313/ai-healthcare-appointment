import './globals.css'

export const metadata = {
  title: 'MediBook — AI Healthcare Appointments',
  description: 'AI-powered clinic appointment management platform',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 antialiased">{children}</body>
    </html>
  )
}
