import { getRequestConfig } from 'next-intl/server'

// Static imports to avoid webpack dynamic import issues during build
import enMessages from '../messages/en.json'
import esMessages from '../messages/es.json'
import ptMessages from '../messages/pt.json'

import { isValidLocale, defaultLocale } from './i18n/config'

// Message map for static resolution
const messageMap: Record<string, Record<string, unknown>> = {
  en: enMessages,
  pt: ptMessages,
  es: esMessages,
}

export default getRequestConfig(({ locale }) => {
  // Durante SSG, o locale pode não estar disponível corretamente
  // Vamos garantir que sempre temos um locale válido
  const validLocale =
    locale != null && locale.length > 0 && isValidLocale(locale) ? locale : defaultLocale

  // Use static imports instead of dynamic imports for build stability
  // Explicitly ensure we always have a valid messages object with safe fallback
  const getMessages = (loc: string): Record<string, unknown> => {
    const msgs = messageMap[loc]
    if (msgs) return msgs

    const defaultMsgs = messageMap[defaultLocale]
    if (defaultMsgs) return defaultMsgs

    // Final fallback to English
    return messageMap.en as Record<string, unknown>
  }

  const messages = getMessages(validLocale)

  return {
    locale: validLocale,
    messages,
  }
})
