'use client'

import { useTheme } from 'next-themes'

export function ThemeDebugDisplay() {
  const { theme, resolvedTheme, systemTheme } = useTheme()

  return (
    <div
      style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        backgroundColor: '#ffff00',
        color: '#000000',
        padding: '8px 12px',
        borderRadius: '6px',
        fontSize: '11px',
        zIndex: 9999,
        fontFamily: 'monospace',
        border: '1px solid #000000',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
      }}
    >
      <div>
        <strong>Theme Debug:</strong>
      </div>
      <div>Theme: {theme ?? 'undefined'}</div>
      <div>Resolved: {resolvedTheme ?? 'undefined'}</div>
      <div>System: {systemTheme ?? 'undefined'}</div>
    </div>
  )
}
