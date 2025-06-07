import type { Metadata, Viewport } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import type { ReactNode } from 'react'

import { locales } from '@/i18n/config'

type Props = {
  children: ReactNode
  params: Promise<{ locale: string }>
}

export function generateStaticParams() {
  return locales.map(locale => ({ locale }))
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const messages = await getMessages({ locale })
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://localhost:3000'

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

  const ogLocale = locale === 'pt' ? 'pt_BR' : locale === 'es' ? 'es_ES' : 'en_US'
  const alternateLocales = locales
    .filter(l => l !== locale)
    .map(l => (l === 'pt' ? 'pt_BR' : l === 'es' ? 'es_ES' : 'en_US'))

  return {
    title: {
      template: '%s | Works Boilerplate',
      default: 'Works Boilerplate',
    },
    description: t('common.description'),
    manifest: '/manifest.json',
    applicationName: 'Works Boilerplate',
    appleWebApp: {
      capable: true,
      statusBarStyle: 'black-translucent',
      title: 'Works Boilerplate',
    },
    keywords: ['SaaS', 'boilerplate', 'Next.js', 'React', 'TypeScript', 'mobile-first', 'PWA'],
    authors: [{ name: 'Works Boilerplate Team' }],
    creator: 'Works Boilerplate',
    publisher: 'Works Boilerplate',
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    icons: {
      icon: '/favicon.ico',
    },
    other: {
      'mobile-web-app-capable': 'yes',
    },
    metadataBase: new URL(baseUrl),
    openGraph: {
      type: 'website',
      locale: ogLocale,
      alternateLocale: alternateLocales,
      title: 'Works Boilerplate',
      description: t('common.description'),
      siteName: 'Works Boilerplate',
      images: [
        {
          url: '/og-image.jpg',
          width: 1200,
          height: 630,
          alt: 'Works Boilerplate',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Works Boilerplate',
      description: t('common.description'),
      images: ['/og-image.jpg'],
    },
    alternates: {
      canonical: `${baseUrl}/${locale}`,
      languages: {
        'pt-BR': `${baseUrl}/pt`,
        'en-US': `${baseUrl}/en`,
        'es-ES': `${baseUrl}/es`,
        'x-default': `${baseUrl}/pt`,
      },
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    verification: {
      google: process.env.GOOGLE_SITE_VERIFICATION,
    },
  }
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params
  const messages = await getMessages({ locale })

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  )
}
