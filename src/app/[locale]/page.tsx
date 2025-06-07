import { useTranslations } from 'next-intl'

import { LocaleSwitcher } from '@/components/shared/LocaleSwitcher'

export default function HomePage() {
  const t = useTranslations()

  return (
    <main className='min-h-screen p-4'>
      <div className='mb-8 flex items-center justify-between'>
        <h1 className='text-2xl font-bold'>{t('common.navigation.home')}</h1>
        <LocaleSwitcher />
      </div>
      <p className='text-gray-600'>{t('dashboard.welcome')}</p>
    </main>
  )
}
