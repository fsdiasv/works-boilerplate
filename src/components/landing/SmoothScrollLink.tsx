'use client'

import { type HTMLAttributes } from 'react'

interface SmoothScrollLinkProps extends HTMLAttributes<HTMLAnchorElement> {
  href: string
}

export function SmoothScrollLink({ href, children, className, ...props }: SmoothScrollLinkProps) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    const targetId = href.replace('#', '')
    const targetElement = document.getElementById(targetId)

    if (targetElement) {
      targetElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    }
  }

  return (
    <a href={href} onClick={handleClick} className={className} {...props}>
      {children}
    </a>
  )
}
