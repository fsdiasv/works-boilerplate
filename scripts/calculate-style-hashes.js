#!/usr/bin/env node

/**
 * Script to calculate SHA-256 hashes for inline styles
 * Use this to add specific inline styles to CSP whitelist
 */

const crypto = require('crypto')

// Add your inline styles here
const inlineStyles = [
  'body { margin: 0; }',
  '.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border-width: 0; }',
]

console.log('CSP Style Hashes:')
console.log('================')

inlineStyles.forEach(style => {
  const hash = crypto.createHash('sha256').update(style).digest('base64')

  console.log(`Style: ${style}`)
  console.log(`Hash: 'sha256-${hash}'`)
  console.log('')
})

console.log('Add these hashes to your CSP style-src directive.')
