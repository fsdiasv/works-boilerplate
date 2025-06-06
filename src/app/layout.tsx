import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Works Boilerplate',
  description: 'Mobile-first SaaS starter kit for modern web applications',
  manifest: '/manifest.json',
  applicationName: 'Works Boilerplate',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Works Boilerplate',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: 'Works Boilerplate',
    title: 'Works Boilerplate',
    description: 'Mobile-first SaaS starter kit',
  },
  twitter: {
    card: 'summary',
    title: 'Works Boilerplate',
    description: 'Mobile-first SaaS starter kit',
  },
  icons: {
    icon: '/favicon.ico',
  },
  metadataBase: new URL(
    process.env.NODE_ENV === 'production'
      ? 'https://works-boilerplate.com'
      : 'http://localhost:3000'
  ),
  other: {
    'mobile-web-app-capable': 'yes',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en'>
      <body className='antialiased'>{children}</body>
    </html>
  )
}
