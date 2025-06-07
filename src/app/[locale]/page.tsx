import { getTranslations } from 'next-intl/server'

import { LocaleSwitcher } from '@/components/shared/LocaleSwitcher'

type Props = {
  params: Promise<{ locale: string }>
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'common' })
  const tDashboard = await getTranslations({ locale, namespace: 'dashboard' })

  return (
    <main className='min-h-screen p-4'>
      <div className='mb-8 flex items-center justify-between'>
        <h1 className='text-2xl font-bold'>{t('navigation.home')}</h1>
        <LocaleSwitcher />
      </div>
      <p className='text-gray-600'>{tDashboard('welcome')}</p>
    </main>
  )
}
