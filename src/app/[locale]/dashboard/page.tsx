import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'

import { Dashboard } from '@/components/dashboard/Dashboard'

interface DashboardPageProps {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: DashboardPageProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'dashboard' })

  return {
    title: t('meta.title'),
    description: t('meta.description'),
  }
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { locale } = await params

  if (!locale) {
    notFound()
  }

  return <Dashboard />
}
