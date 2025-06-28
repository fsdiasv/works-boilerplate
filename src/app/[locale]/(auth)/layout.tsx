import type React from 'react'

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className='flex min-h-screen items-center justify-center bg-sw-surface-background p-4'>
      <div className='w-full max-w-md'>{children}</div>
    </div>
  )
}