/* eslint-disable no-console, @typescript-eslint/no-non-null-assertion */
import { locales } from '@/i18n/config'

interface Messages {
  [key: string]: string | Messages
}

/**
 * Recursively extracts all translation keys from a messages object
 */
function extractKeys(obj: Messages, prefix = ''): string[] {
  const keys: string[] = []

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key

    if (typeof value === 'string') {
      keys.push(fullKey)
    } else {
      keys.push(...extractKeys(value, fullKey))
    }
  }

  return keys
}

/**
 * Validates that all locales have the same translation keys
 */
export async function validateTranslations(): Promise<{
  isValid: boolean
  missingKeys: Record<string, string[]>
  extraKeys: Record<string, string[]>
}> {
  const allMessages: Record<string, Messages> = {}
  const allKeys: Record<string, string[]> = {}

  // Load all translation files
  for (const locale of locales) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const messages = await import(`../../messages/${locale}.json`)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      allMessages[locale] = messages.default as Messages
      allKeys[locale] = extractKeys(allMessages[locale])
    } catch (error) {
      console.error(`Failed to load messages for locale ${locale}:`, error)
      return {
        isValid: false,
        missingKeys: { [locale]: ['Failed to load'] },
        extraKeys: {},
      }
    }
  }

  // Use first locale as reference
  const referenceLocale = locales[0]
  const referenceKeys = allKeys[referenceLocale]!

  const missingKeys: Record<string, string[]> = {}
  const extraKeys: Record<string, string[]> = {}

  // Check each locale against reference
  for (const locale of locales) {
    if (locale === referenceLocale) continue

    const localeKeys = allKeys[locale]!
    // Skip if no keys found (shouldn't happen with valid locales)

    // Find missing keys
    const missing = referenceKeys.filter(key => !localeKeys.includes(key))
    if (missing.length > 0) {
      missingKeys[locale] = missing
    }

    // Find extra keys
    const extra = localeKeys.filter(key => !referenceKeys.includes(key))
    if (extra.length > 0) {
      extraKeys[locale] = extra
    }
  }

  const isValid = Object.keys(missingKeys).length === 0 && Object.keys(extraKeys).length === 0

  return {
    isValid,
    missingKeys,
    extraKeys,
  }
}

/**
 * Validates ICU message format syntax
 */
export function validateICUMessages(messages: Messages, locale: string): string[] {
  const errors: string[] = []

  function validateObject(obj: Messages, prefix = ''): void {
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key

      if (typeof value === 'string') {
        // Check for basic ICU syntax issues
        const icuPattern = /{[^}]+}/g
        const matches = value.match(icuPattern)

        if (matches) {
          for (const match of matches) {
            // Remove braces
            const content = match.slice(1, -1)

            // Check for plural/select syntax
            if (content.includes('plural') || content.includes('select')) {
              // Basic validation - should have comma-separated parts
              if (!content.includes(',')) {
                errors.push(`${locale}:${fullKey} - Invalid ICU syntax: ${match}`)
              }
            }

            // Check for balanced braces in complex messages
            const openBraces = (content.match(/{/g) ?? []).length
            const closeBraces = (content.match(/}/g) ?? []).length
            if (openBraces !== closeBraces) {
              errors.push(`${locale}:${fullKey} - Unbalanced braces in: ${match}`)
            }
          }
        }
      } else {
        validateObject(value, fullKey)
      }
    }
  }

  validateObject(messages)
  return errors
}

/**
 * CLI utility to validate all translations
 */
export async function validateAllTranslations(): Promise<void> {
  console.log('🔍 Validating translations...')

  const { isValid, missingKeys, extraKeys } = await validateTranslations()

  if (!isValid) {
    console.error('❌ Translation validation failed!')

    if (Object.keys(missingKeys).length > 0) {
      console.error('\n📝 Missing keys:')
      for (const [locale, keys] of Object.entries(missingKeys)) {
        console.error(`  ${locale}: ${keys.join(', ')}`)
      }
    }

    if (Object.keys(extraKeys).length > 0) {
      console.error('\n➕ Extra keys:')
      for (const [locale, keys] of Object.entries(extraKeys)) {
        console.error(`  ${locale}: ${keys.join(', ')}`)
      }
    }

    process.exit(1)
  }

  // Validate ICU syntax
  console.log('🔍 Validating ICU message format...')
  let icuErrors = 0

  for (const locale of locales) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const messages = await import(`../../messages/${locale}.json`)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const errors = validateICUMessages(messages.default as Messages, locale)
      if (errors.length > 0) {
        console.error(`❌ ICU validation errors in ${locale}:`)
        errors.forEach(error => console.error(`  ${error}`))
        icuErrors += errors.length
      }
    } catch (error) {
      console.error(`❌ Failed to validate ICU for ${locale}:`, error)
      icuErrors++
    }
  }

  if (icuErrors > 0) {
    console.error(`❌ Found ${icuErrors} ICU validation errors`)
    process.exit(1)
  }

  console.log('✅ All translations are valid!')
}
