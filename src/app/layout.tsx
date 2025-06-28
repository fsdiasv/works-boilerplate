import { Inter } from 'next/font/google'
import type React from 'react'

import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html suppressHydrationWarning className={inter.variable} lang='en'>
      <body className='font-sans antialiased' suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}
