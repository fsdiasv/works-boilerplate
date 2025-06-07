import { getRequestConfig } from 'next-intl/server'

import { isValidLocale, defaultLocale } from './i18n/config'

export default getRequestConfig(async ({ locale }) => {
  // Durante SSG, o locale pode não estar disponível corretamente
  // Vamos garantir que sempre temos um locale válido
  const validLocale =
    locale != null && locale.length > 0 && isValidLocale(locale) ? locale : defaultLocale

  return {
    locale: validLocale,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    messages: (await import(`../messages/${validLocale}.json`)).default as Record<string, unknown>,
  }
})
