import Link from 'next/link'
import { useTranslations } from 'next-intl'

export default function NotFound() {
  const t = useTranslations('errors')
  const tCommon = useTranslations('common')

  return (
    <div className='min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8'>
      <div className='max-w-md w-full space-y-8 text-center'>
        <div>
          <h1 className='text-9xl font-bold text-gray-200 dark:text-gray-700'>404</h1>
          <h2 className='mt-4 text-2xl font-bold text-gray-900 dark:text-gray-100'>
            {t('notFound')}
          </h2>
          <p className='mt-2 text-gray-600 dark:text-gray-400'>{t('generic')}</p>
        </div>

        <div className='space-y-4'>
          <Link
            href='/'
            className='
              inline-flex
              items-center
              justify-center
              min-h-[44px]
              px-6
              py-3
              text-base
              font-medium
              text-white
              bg-blue-600
              hover:bg-blue-700
              focus:outline-none
              focus:ring-2
              focus:ring-offset-2
              focus:ring-blue-500
              rounded-lg
              transition-colors
              duration-200
              touch-manipulation
            '
          >
            {tCommon('navigation.home')}
          </Link>

          <button
            onClick={() => window.history.back()}
            className='
              block
              w-full
              min-h-[44px]
              px-6
              py-3
              text-base
              font-medium
              text-gray-700
              dark:text-gray-300
              bg-gray-100
              dark:bg-gray-800
              hover:bg-gray-200
              dark:hover:bg-gray-700
              focus:outline-none
              focus:ring-2
              focus:ring-offset-2
              focus:ring-gray-500
              rounded-lg
              transition-colors
              duration-200
              touch-manipulation
            '
          >
            {tCommon('actions.back')}
          </button>
        </div>
      </div>
    </div>
  )
}
