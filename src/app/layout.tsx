import { ReactNode } from 'react'

import './globals.css'
import { ThemeProvider } from '@/lib/theme-provider'

type RootLayoutProps = {
  children: ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body className='antialiased'>
        <ThemeProvider
          attribute='class'
          defaultTheme='system'
          enableSystem
          disableTransitionOnChange={false}
          storageKey='works-boilerplate-theme'
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
