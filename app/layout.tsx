import type { Metadata } from 'next'
import './globals.css'
import { ToastHost } from '@/components/mobile/Toast'

export const metadata: Metadata = {
  title: 'CycleBees - Bike Service Management',
  description: 'Professional bike service estimate management system',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
        {/* Global toast host */}
        <ToastHost />
      </body>
    </html>
  )
}
