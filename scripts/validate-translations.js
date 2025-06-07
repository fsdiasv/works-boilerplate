#!/usr/bin/env node

/**
 * Translation validation script for CI/CD
 * Validates that all translation files have consistent keys and valid ICU syntax
 */

const { validateAllTranslations } = require('../src/lib/i18n-validation.ts')

// Run validation
validateAllTranslations().catch(error => {
  console.error('❌ Translation validation failed:', error)
  process.exit(1)
})
