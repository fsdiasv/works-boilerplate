#!/usr/bin/env node

const crypto = require('crypto')

// Generate a secure random string of specified length
function generateSecret(length = 32) {
  return crypto.randomBytes(length).toString('base64url')
}

const secret = generateSecret(32)
console.log('Generated INTERNAL_API_SECRET:')
console.log(secret)
console.log(`\nLength: ${secret.length} characters`)
console.log('\nAdd this to your .env.local file:')
console.log(`INTERNAL_API_SECRET="${secret}"`)