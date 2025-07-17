import { ArrowRight, Menu } from 'lucide-react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { Suspense } from 'react'

import { AuthErrorHandler } from '@/components/landing/AuthErrorHandler'
import { SmoothScrollLink } from '@/components/landing/SmoothScrollLink'
import { LocaleSwitcher } from '@/components/shared/LocaleSwitcher'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

// Dynamic imports for below-the-fold sections
const FeaturesSection = dynamic(() => import('@/components/landing/FeaturesSection'), {
  loading: () => <SectionSkeleton />,
})

const PricingSection = dynamic(() => import('@/components/landing/PricingSection'), {
  loading: () => <SectionSkeleton />,
})

const TestimonialsSection = dynamic(() => import('@/components/landing/TestimonialsSection'), {
  loading: () => <SectionSkeleton />,
})

const FAQSection = dynamic(() => import('@/components/landing/FAQSection'), {
  loading: () => <SectionSkeleton />,
})

const CTASection = dynamic(() => import('@/components/landing/CTASection'), {
  loading: () => <SectionSkeleton />,
})

const Footer = dynamic(() => import('@/components/landing/Footer'), {
  loading: () => <FooterSkeleton />,
})

// Loading skeletons
function SectionSkeleton() {
  return (
    <div className='py-20'>
      <div className='container mx-auto px-4'>
        <Skeleton className='mx-auto mb-4 h-10 w-64' />
        <Skeleton className='mx-auto mb-12 h-6 w-96' />
        <div className='grid gap-6 md:grid-cols-3'>
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className='h-48 rounded-lg' />
          ))}
        </div>
      </div>
    </div>
  )
}

function FooterSkeleton() {
  return (
    <div className='border-t py-12'>
      <div className='container mx-auto px-4'>
        <Skeleton className='h-32' />
      </div>
    </div>
  )
}

type Props = {
  params: Promise<{ locale: string }>
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'landing' })

  return (
    <div className='min-h-screen'>
      {/* Auth Error Handler - Process auth errors from URL fragments */}
      <AuthErrorHandler />

      {/* Header - Keep inline for immediate rendering */}
      <header className='bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur'>
        <div className='container mx-auto px-4'>
          <div className='flex h-16 items-center justify-between'>
            <div className='flex items-center gap-6'>
              <h1 className='text-2xl font-bold'>Works</h1>
              <nav className='hidden gap-6 md:flex'>
                <SmoothScrollLink
                  href='#features'
                  className='hover:text-primary text-sm font-medium'
                >
                  {t('nav.features')}
                </SmoothScrollLink>
                <SmoothScrollLink
                  href='#pricing'
                  className='hover:text-primary text-sm font-medium'
                >
                  {t('nav.pricing')}
                </SmoothScrollLink>
                <SmoothScrollLink
                  href='#testimonials'
                  className='hover:text-primary text-sm font-medium'
                >
                  {t('nav.testimonials')}
                </SmoothScrollLink>
                <SmoothScrollLink href='#faq' className='hover:text-primary text-sm font-medium'>
                  {t('nav.faq')}
                </SmoothScrollLink>
              </nav>
            </div>
            <div className='flex items-center gap-4'>
              <LocaleSwitcher />
              <Link href={`/${locale}/auth/login`}>
                <Button variant='ghost' size='sm'>
                  {t('nav.signin')}
                </Button>
              </Link>
              <Link href={`/${locale}/auth/signup`}>
                <Button size='sm'>{t('nav.getStarted')}</Button>
              </Link>
              <Button variant='ghost' size='icon' className='md:hidden'>
                <Menu className='h-5 w-5' />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section - Keep inline for LCP */}
      <section className='relative overflow-hidden py-20 md:py-32'>
        <div className='container mx-auto px-4'>
          <div className='mx-auto max-w-4xl text-center'>
            <Badge className='mb-4' variant='secondary'>
              {t('hero.badge')}
            </Badge>
            <h1 className='mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl'>
              {t('hero.title')}
            </h1>
            <p className='text-muted-foreground mb-8 text-lg sm:text-xl'>{t('hero.subtitle')}</p>
            <div className='flex flex-col justify-center gap-4 sm:flex-row'>
              <Link href={`/${locale}/auth/signup`}>
                <Button size='lg' className='w-full sm:w-auto'>
                  {t('hero.cta.primary')}
                  <ArrowRight className='ml-2 h-4 w-4' />
                </Button>
              </Link>
              <Link href={`/${locale}/dashboard`}>
                <Button size='lg' variant='outline' className='w-full sm:w-auto'>
                  {t('hero.cta.secondary')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Dynamically loaded sections */}
      <Suspense fallback={<SectionSkeleton />}>
        <FeaturesSection locale={locale} />
      </Suspense>

      <Suspense fallback={<SectionSkeleton />}>
        <PricingSection locale={locale} />
      </Suspense>

      <Suspense fallback={<SectionSkeleton />}>
        <TestimonialsSection locale={locale} />
      </Suspense>

      <Suspense fallback={<SectionSkeleton />}>
        <FAQSection locale={locale} />
      </Suspense>

      <Suspense fallback={<SectionSkeleton />}>
        <CTASection locale={locale} />
      </Suspense>

      <Suspense fallback={<FooterSkeleton />}>
        <Footer locale={locale} />
      </Suspense>
    </div>
  )
}
