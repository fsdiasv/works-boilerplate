'use client'

type BackButtonProps = {
  children: React.ReactNode
  className?: string
}

export default function BackButton({ children, className }: BackButtonProps) {
  return (
    <button onClick={() => window.history.back()} className={className}>
      {children}
    </button>
  )
}
