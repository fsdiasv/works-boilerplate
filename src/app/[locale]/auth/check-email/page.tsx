'use client'

import { Mail } from 'lucide-react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'

import { AuthLayout } from '@/components/auth/auth-layout'
import { Button } from '@/components/ui/button'

export default function CheckEmailPage() {
  const t = useTranslations('auth.checkEmail')
  const locale = useLocale()

  return (
    <AuthLayout>
      <div className='w-full text-center'>
        <div className='mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100'>
          <Mail className='h-8 w-8 text-blue-600' />
        </div>

        <h1 className='mb-2 text-3xl font-bold text-slate-800 sm:text-4xl lg:text-5xl'>
          {t('title')}
        </h1>

        <p className='mb-8 text-sm text-slate-500 sm:text-base lg:text-lg'>{t('description')}</p>

        <div className='mb-8 rounded-lg bg-slate-50 p-6'>
          <p className='mb-2 text-sm font-semibold text-slate-700'>{t('checkSpam')}</p>
          <p className='text-xs text-slate-500'>{t('notReceived')}</p>
        </div>

        <div className='space-y-3'>
          <Button asChild className='w-full'>
            <Link href={`/${locale}/auth/login`}>{t('backToLogin')}</Link>
          </Button>

          <p className='text-xs text-slate-500'>
            {t('havingTrouble')}{' '}
            <Link
              href={`/${locale}/support`}
              className='font-semibold text-blue-600 hover:text-blue-700'
            >
              {t('contactSupport')}
            </Link>
          </p>
        </div>
      </div>
    </AuthLayout>
  )
}
