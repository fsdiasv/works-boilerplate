'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function LocalError({ error, reset }: ErrorProps) {
  const t = useTranslations('errors')
  const tCommon = useTranslations('common')
  const router = useRouter()

  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application Error:', error)
  }, [error])

  return (
    <div className='flex min-h-screen items-center justify-center px-4 sm:px-6 lg:px-8'>
      <div className='w-full max-w-md space-y-8 text-center'>
        <div>
          <div className='mx-auto h-24 w-24 text-red-500'>
            <svg fill='none' stroke='currentColor' viewBox='0 0 24 24' className='h-full w-full'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='2'
                d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
              />
            </svg>
          </div>

          <h2 className='mt-4 text-2xl font-bold text-gray-900 dark:text-gray-100'>
            {tCommon('status.error')}
          </h2>

          <p className='mt-2 text-gray-600 dark:text-gray-400'>{t('generic')}</p>

          {process.env.NODE_ENV === 'development' && (
            <details className='mt-4 text-left'>
              <summary className='cursor-pointer text-sm font-medium text-gray-500 hover:text-gray-700'>
                Technical Details
              </summary>
              <pre className='mt-2 overflow-auto text-xs text-gray-400'>
                {error.message}
                {error.digest != null && (
                  <>
                    {'\n'}
                    Digest: {error.digest}
                  </>
                )}
              </pre>
            </details>
          )}
        </div>

        <div className='space-y-4'>
          <button
            onClick={reset}
            className='inline-flex min-h-[44px] touch-manipulation items-center justify-center rounded-lg bg-blue-600 px-6 py-3 text-base font-medium text-white transition-colors duration-200 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none'
          >
            {tCommon('actions.retry')}
          </button>

          <button
            onClick={() => router.push('/')}
            className='block min-h-[44px] w-full touch-manipulation rounded-lg bg-gray-100 px-6 py-3 text-base font-medium text-gray-700 transition-colors duration-200 hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:outline-none dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
          >
            {tCommon('navigation.home')}
          </button>
        </div>
      </div>
    </div>
  )
}
