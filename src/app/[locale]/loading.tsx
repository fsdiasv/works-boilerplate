import { useTranslations } from 'next-intl'

export default function Loading() {
  const t = useTranslations('common.actions')

  return (
    <div className='flex min-h-screen items-center justify-center'>
      <div className='space-y-4 text-center'>
        <div className='inline-flex h-16 w-16 items-center justify-center'>
          <div className='h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent'></div>
        </div>
        <p className='text-lg font-medium text-gray-900 dark:text-gray-100'>{t('loading')}</p>
      </div>
    </div>
  )
}
