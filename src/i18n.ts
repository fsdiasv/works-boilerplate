import { getRequestConfig } from 'next-intl/server'

import { isValidLocale, defaultLocale } from './i18n/config'

export default getRequestConfig(async ({ locale }) => {
  // Durante SSG, o locale pode não estar disponível corretamente
  // Vamos garantir que sempre temos um locale válido
  const validLocale =
    locale != null && locale.length > 0 && isValidLocale(locale) ? locale : defaultLocale

  // Import with proper typing
  const messages = (await import(`../messages/${validLocale}.json`)) as {
    default: Record<string, unknown>
  }

  return {
    locale: validLocale,
    messages: messages.default,
  }
})
