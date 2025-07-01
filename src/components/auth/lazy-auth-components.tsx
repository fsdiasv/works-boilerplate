'use client'

import dynamic from 'next/dynamic'

// Lazy load auth components to reduce initial bundle size
export const AuthLayout = dynamic(
  () => import('./auth-layout').then(mod => ({ default: mod.AuthLayout })),
  {
    ssr: true,
  }
)

export const Testimonial = dynamic(
  () => import('./testimonial').then(mod => ({ default: mod.Testimonial })),
  {
    ssr: true,
  }
)
