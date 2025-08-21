import { notFound } from 'next/navigation'
import type { Messages } from 'next-intl'
import { getRequestConfig } from 'next-intl/server'

// Static imports to avoid webpack dynamic import issues during build
import enMessages from '../../messages/en.json'
import esMessages from '../../messages/es.json'
import ptMessages from '../../messages/pt.json'

import { isValidLocale, type Locale } from './config'

// Message map for static resolution with strict typing
const messageMap: Readonly<Record<Locale, Messages>> = {
  en: enMessages as Messages,
  pt: ptMessages as Messages,
  es: esMessages as Messages,
}

export default getRequestConfig(({ locale }) => {
  if (locale === undefined || !isValidLocale(locale)) notFound()

  // Use static imports for build stability - locale is validated by isValidLocale
  const messages = messageMap[locale]

  return {
    locale,
    messages,
    timeZone: 'America/Sao_Paulo',
    now: new Date(),
  }
})
