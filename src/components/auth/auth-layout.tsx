import { ReactNode } from 'react'
import { Testimonial } from './testimonial'

interface AuthLayoutProps {
  children: ReactNode
  showTestimonial?: boolean
}

export function AuthLayout({ children, showTestimonial = true }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex">
      <div className={`flex-1 flex items-center justify-center p-8 ${showTestimonial ? 'lg:w-[60%]' : ''}`}>
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
      {showTestimonial && (
        <div className="hidden lg:block lg:w-[40%] bg-slate-50">
          <Testimonial />
        </div>
      )}
    </div>
  )
}