import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

import { Button } from '@/components/ui/button'

interface CTASectionProps {
  locale: string
}

export default async function CTASection({ locale }: CTASectionProps) {
  const t = await getTranslations({ locale, namespace: 'landing' })

  return (
    <section className='bg-primary text-primary-foreground py-20'>
      <div className='container mx-auto px-4'>
        <div className='mx-auto max-w-4xl text-center'>
          <h2 className='mb-4 text-3xl font-bold tracking-tight sm:text-4xl'>{t('cta.title')}</h2>
          <p className='mb-8 text-lg opacity-90'>{t('cta.subtitle')}</p>
          <div className='flex flex-col justify-center gap-4 sm:flex-row'>
            <Link href={`/${locale}/auth/signup`}>
              <Button size='lg' variant='secondary' className='w-full sm:w-auto'>
                {t('cta.primaryButton')}
                <ArrowRight className='ml-2 h-4 w-4' />
              </Button>
            </Link>
            <Button
              size='lg'
              variant='outline'
              className='border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary w-full sm:w-auto'
            >
              {t('cta.secondaryButton')}
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
