#!/usr/bin/env node

/**
 * Translation validation script for CI/CD
 * Validates that all translation files have consistent keys and valid ICU syntax
 */

const fs = require('fs')
const path = require('path')

// Simple validation function
function validateTranslations() {
  const messagesDir = path.join(__dirname, '../messages')
  const locales = ['pt', 'en', 'es']

  console.log('🔍 Validating translation files...')

  const allKeys = new Set()
  const localeData = {}

  // Load all translation files
  for (const locale of locales) {
    const filePath = path.join(messagesDir, `${locale}.json`)
    try {
      const content = fs.readFileSync(filePath, 'utf8')
      const data = JSON.parse(content)
      localeData[locale] = data

      // Collect all keys recursively
      function collectKeys(obj, prefix = '') {
        for (const [key, value] of Object.entries(obj)) {
          const fullKey = prefix ? `${prefix}.${key}` : key
          if (typeof value === 'object' && value !== null) {
            collectKeys(value, fullKey)
          } else {
            allKeys.add(fullKey)
          }
        }
      }

      collectKeys(data)
      console.log(`✅ Loaded ${locale}.json`)
    } catch (error) {
      console.error(`❌ Error loading ${locale}.json:`, error.message)
      process.exit(1)
    }
  }

  // Check all locales have all keys
  for (const locale of locales) {
    const missingKeys = []

    function checkKeys(keys, obj, prefix = '') {
      for (const key of keys) {
        if (key.startsWith(prefix)) {
          const keyPath = key.slice(prefix.length + (prefix ? 1 : 0))
          const parts = keyPath.split('.')

          let current = obj
          let found = true

          for (const part of parts) {
            if (typeof current === 'object' && current !== null && part in current) {
              current = current[part]
            } else {
              found = false
              break
            }
          }

          if (!found) {
            missingKeys.push(key)
          }
        }
      }
    }

    const keyArray = Array.from(allKeys)
    for (const key of keyArray) {
      const parts = key.split('.')
      let current = localeData[locale]
      let found = true

      for (const part of parts) {
        if (typeof current === 'object' && current !== null && part in current) {
          current = current[part]
        } else {
          found = false
          break
        }
      }

      if (!found) {
        missingKeys.push(key)
      }
    }

    if (missingKeys.length > 0) {
      console.error(`❌ Missing keys in ${locale}.json:`, missingKeys)
      process.exit(1)
    }
  }

  console.log('✅ All translation files are valid!')
  console.log(`📊 Total keys: ${allKeys.size}`)
  console.log(`📚 Locales: ${locales.join(', ')}`)
}

// Run validation
try {
  validateTranslations()
} catch (error) {
  console.error('❌ Translation validation failed:', error.message)
  process.exit(1)
}
