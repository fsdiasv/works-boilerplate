import { notFound } from 'next/navigation'
import { getRequestConfig } from 'next-intl/server'

import { isValidLocale } from './config'

export default getRequestConfig(async ({ locale }) => {
  if (locale === undefined || !isValidLocale(locale)) notFound()

  return {
    locale,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    messages: (await import(`../../messages/${locale}.json`)).default as Record<string, unknown>,
    timeZone: 'America/Sao_Paulo',
    now: new Date(),
  }
})
