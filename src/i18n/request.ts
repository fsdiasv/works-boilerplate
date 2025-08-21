import { notFound } from 'next/navigation'
import { getRequestConfig } from 'next-intl/server'

// Static imports to avoid webpack dynamic import issues during build
import enMessages from '../../messages/en.json'
import esMessages from '../../messages/es.json'
import ptMessages from '../../messages/pt.json'

import { isValidLocale, defaultLocale } from './config'

// Message map for static resolution
const messageMap: Record<string, Record<string, unknown>> = {
  en: enMessages,
  pt: ptMessages,
  es: esMessages,
}

export default getRequestConfig(({ locale }) => {
  if (locale === undefined || !isValidLocale(locale)) notFound()

  // Use static imports instead of dynamic imports for build stability
  const getMessages = (loc: string): Record<string, unknown> => {
    const msgs = messageMap[loc]
    if (msgs) return msgs

    const defaultMsgs = messageMap[defaultLocale]
    if (defaultMsgs) return defaultMsgs

    // Final fallback to English
    return messageMap.en as Record<string, unknown>
  }

  const messages = getMessages(locale)

  return {
    locale,
    messages,
    timeZone: 'America/Sao_Paulo',
    now: new Date(),
  }
})
