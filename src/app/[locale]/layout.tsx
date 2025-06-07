import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import type { ReactNode } from 'react'

import { isValidLocale, locales } from '@/i18n/config'

type Props = {
  children: ReactNode
  params: Promise<{ locale: string }>
}

export function generateStaticParams() {
  return locales.map(locale => ({ locale }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const messages = await getMessages({ locale })
  const t = (key: string): string => {
    const keys = key.split('.')
    let value: unknown = messages
    for (const k of keys) {
      if (value !== null && typeof value === 'object') {
        value = (value as Record<string, unknown>)[k]
      } else {
        return key
      }
    }
    return typeof value === 'string' ? value : key
  }

  return {
    title: {
      template: '%s | Works Boilerplate',
      default: 'Works Boilerplate',
    },
    description: t('common.description'),
    openGraph: {
      locale: locale === 'pt' ? 'pt_BR' : locale === 'es' ? 'es_ES' : 'en_US',
      alternateLocale: locales
        .filter(l => l !== locale)
        .map(l => (l === 'pt' ? 'pt_BR' : l === 'es' ? 'es_ES' : 'en_US')),
    },
    alternates: {
      canonical: `/${locale}`,
      languages: {
        'pt-BR': '/pt',
        'en-US': '/en',
        'es-ES': '/es',
      },
    },
  }
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params
  if (!isValidLocale(locale)) {
    notFound()
  }

  const messages = await getMessages()

  return (
    <html lang={locale} dir='ltr'>
      <body className='antialiased'>
        <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>
      </body>
    </html>
  )
}
