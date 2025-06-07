import { useTranslations } from 'next-intl'

export default function Loading() {
  const t = useTranslations('common.actions')

  return (
    <div className='min-h-screen flex items-center justify-center'>
      <div className='text-center space-y-4'>
        <div className='inline-flex items-center justify-center w-16 h-16'>
          <div className='animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent'></div>
        </div>
        <p className='text-lg font-medium text-gray-900 dark:text-gray-100'>{t('loading')}</p>
      </div>
    </div>
  )
}
