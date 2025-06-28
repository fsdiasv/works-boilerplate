'use client'

import Link from 'next/link'
import { type ComponentPropsWithoutRef } from 'react'

interface SmoothScrollLinkProps extends Omit<ComponentPropsWithoutRef<typeof Link>, 'href'> {
  href: string
}

export function SmoothScrollLink({ href, children, className, ...props }: SmoothScrollLinkProps) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Only handle smooth scrolling for hash links
    if (href.startsWith('#')) {
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
  }

  return (
    <Link href={href} className={className} {...props} onClick={handleClick}>
      {children}
    </Link>
  )
}
