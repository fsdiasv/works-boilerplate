'use client'

import { useEffect } from 'react'

interface ScriptWithNonceProps {
  children: string
  id?: string
}

/**
 * Component for adding inline scripts with CSP nonce support
 * Use this instead of dangerouslySetInnerHTML for inline scripts
 */
export function ScriptWithNonce({ children, id }: ScriptWithNonceProps) {
  useEffect(() => {
    // Get nonce from meta tag or header
    const nonceElement = document.querySelector('meta[name="csp-nonce"]')
    const nonce = nonceElement?.getAttribute('content') ?? ''

    // Create script element with nonce
    const script = document.createElement('script')
    if (id !== undefined) script.id = id
    if (nonce !== '') script.nonce = nonce
    script.textContent = children

    // Append to body
    document.body.appendChild(script)

    // Cleanup
    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script)
      }
    }
  }, [children, id])

  return null
}
