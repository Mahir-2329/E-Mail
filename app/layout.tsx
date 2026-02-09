import type { Metadata, Viewport } from 'next'
import './globals.css'
import { themeScript } from './theme-script'

export const metadata: Metadata = {
  title: 'Email Sender App',
  description: 'Send emails to pending recipients',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon-512x512.png',
    apple: '/icon-512x512.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Email Sender',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#6366f1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  )
}
