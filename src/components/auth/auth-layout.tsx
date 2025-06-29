import { ReactNode } from 'react'

import { Testimonial } from './testimonial'

interface AuthLayoutProps {
  children: ReactNode
  showTestimonial?: boolean
}

export function AuthLayout({ children, showTestimonial = true }: AuthLayoutProps) {
  return (
    <div className='flex min-h-screen'>
      {/* Left side - Form */}
      <div className='flex w-full flex-col justify-center px-4 py-8 sm:px-6 sm:py-12 lg:w-[55%] lg:px-12 xl:px-20 2xl:px-32'>
        <div className='mx-auto w-full max-w-md lg:max-w-xl'>{children}</div>
      </div>

      {/* Right side - Testimonial */}
      {showTestimonial && (
        <div className='hidden bg-slate-50 lg:block lg:w-[45%]'>
          <Testimonial />
        </div>
      )}
    </div>
  )
}
