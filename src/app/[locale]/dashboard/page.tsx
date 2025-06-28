import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'

import { Dashboard } from '@/components/dashboard/Dashboard'

interface DashboardPageProps {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: DashboardPageProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'dashboard' })

  return {
    title: t('title'),
    description: t('overview'),
  }
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { locale } = await params

  if (!locale) {
    notFound()
  }

  return <Dashboard />
}
