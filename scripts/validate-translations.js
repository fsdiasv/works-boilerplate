#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

const messagesDir = path.join(__dirname, '..', 'messages')
const locales = ['en', 'es', 'pt']

function flattenObject(obj, prefix = '') {
  return Object.keys(obj).reduce((acc, key) => {
    const pre = prefix.length ? `${prefix}.` : ''
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      return { ...acc, ...flattenObject(obj[key], pre + key) }
    } else {
      return { ...acc, [pre + key]: obj[key] }
    }
  }, {})
}

function validateTranslations() {
  const translations = {}
  const allKeys = new Set()

  // Load all translation files
  for (const locale of locales) {
    const filePath = path.join(messagesDir, `${locale}.json`)
    if (!fs.existsSync(filePath)) {
      console.error(`❌ Missing translation file: ${filePath}`)
      process.exit(1)
    }

    try {
      const content = JSON.parse(fs.readFileSync(filePath, 'utf8'))
      translations[locale] = flattenObject(content)
      Object.keys(translations[locale]).forEach(key => allKeys.add(key))
    } catch (error) {
      console.error(`❌ Error parsing ${filePath}: ${error.message}`)
      process.exit(1)
    }
  }

  // Check for missing keys
  let hasErrors = false
  for (const key of allKeys) {
    const missingIn = locales.filter(locale => !(key in translations[locale]))
    if (missingIn.length > 0) {
      console.error(`❌ Key "${key}" missing in: ${missingIn.join(', ')}`)
      hasErrors = true
    }
  }

  // Check for extra keys (keys that don't exist in the base locale)
  const baseKeys = Object.keys(translations['en'])
  for (const locale of locales.filter(l => l !== 'en')) {
    const extraKeys = Object.keys(translations[locale]).filter(key => !baseKeys.includes(key))
    if (extraKeys.length > 0) {
      console.error(`❌ Extra keys in ${locale}: ${extraKeys.join(', ')}`)
      hasErrors = true
    }
  }

  if (hasErrors) {
    console.error('\n❌ Translation validation failed!')
    process.exit(1)
  } else {
    console.log('✅ All translations are valid!')
  }
}

validateTranslations()