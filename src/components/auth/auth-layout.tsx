import { ReactNode } from 'react'

import { Testimonial } from './testimonial'

interface AuthLayoutProps {
  children: ReactNode
  showTestimonial?: boolean
}

export function AuthLayout({ children, showTestimonial = true }: AuthLayoutProps) {
  return (
    <div className='flex min-h-screen'>
      <div
        className={`flex flex-1 items-center justify-center p-8 ${showTestimonial ? 'lg:w-[60%]' : ''}`}
      >
        <div className='w-full max-w-md'>{children}</div>
      </div>
      {showTestimonial && (
        <div className='hidden bg-slate-50 lg:block lg:w-[40%]'>
          <Testimonial />
        </div>
      )}
    </div>
  )
}
