'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { useTransition } from 'react'

import { locales, localeNames, localeFlags, type Locale } from '@/i18n/config'

export function LocaleSwitcher() {
  const t = useTranslations('common.language')
  const locale = useLocale() as Locale
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  const handleLocaleChange = (newLocale: Locale) => {
    startTransition(() => {
      const segments = pathname.split('/')
      segments[1] = newLocale
      router.replace(segments.join('/'))
    })
  }

  return (
    <div className='relative'>
      <label htmlFor='locale-switcher' className='sr-only'>
        {t('select')}
      </label>
      <select
        id='locale-switcher'
        value={locale}
        onChange={e => handleLocaleChange(e.target.value as Locale)}
        disabled={isPending}
        className='
          appearance-none
          min-h-[44px]
          min-w-[44px]
          px-4
          py-2
          pr-10
          text-base
          font-medium
          bg-white
          dark:bg-gray-800
          text-gray-900
          dark:text-gray-100
          border
          border-gray-300
          dark:border-gray-600
          rounded-lg
          focus:outline-none
          focus:ring-2
          focus:ring-blue-500
          focus:border-blue-500
          disabled:opacity-50
          disabled:cursor-not-allowed
          cursor-pointer
          touch-manipulation
        '
        aria-label={t('current')}
      >
        {locales.map(loc => (
          <option key={loc} value={loc}>
            {localeFlags[loc]} {localeNames[loc]}
          </option>
        ))}
      </select>
      {/* Custom dropdown arrow */}
      <div className='pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3'>
        <svg
          className='h-5 w-5 text-gray-400'
          xmlns='http://www.w3.org/2000/svg'
          viewBox='0 0 20 20'
          fill='currentColor'
          aria-hidden='true'
        >
          <path
            fillRule='evenodd'
            d='M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zM3.293 9.293a1 1 0 011.414 0L10 14.586l5.293-5.293a1 1 0 011.414 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414z'
            clipRule='evenodd'
          />
        </svg>
      </div>
      {isPending && (
        <div className='absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-gray-800/50 rounded-lg'>
          <div className='h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent' />
        </div>
      )}
    </div>
  )
}
