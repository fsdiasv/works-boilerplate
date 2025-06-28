import { useTranslations } from 'next-intl'

export default function ProfilePage() {
  const t = useTranslations()

  return (
    <div className='container mx-auto p-4'>
      <h1 className='mb-4 text-2xl font-bold'>{t('common.navigation.profile')}</h1>
      <p className='text-muted-foreground'>Profile page coming soon.</p>
    </div>
  )
}
