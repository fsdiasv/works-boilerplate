import type React from 'react'

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className='flex min-h-screen items-center justify-center'>
      <div className='w-full'>{children}</div>
    </div>
  )
}
