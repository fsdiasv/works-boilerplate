import {
  ArrowRight,
  Check,
  Menu,
  Zap,
  Shield,
  BarChart3,
  Users,
  Globe,
  Smartphone,
} from 'lucide-react'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

import { LocaleSwitcher } from '@/components/shared/LocaleSwitcher'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

type Props = {
  params: Promise<{ locale: string }>
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'landing' })

  return (
    <div className='min-h-screen'>
      {/* Header */}
      <header className='bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur'>
        <div className='container mx-auto px-4'>
          <div className='flex h-16 items-center justify-between'>
            <div className='flex items-center gap-6'>
              <h1 className='text-2xl font-bold'>Works</h1>
              <nav className='hidden gap-6 md:flex'>
                <Link href={`#features`} className='hover:text-primary text-sm font-medium'>
                  {t('nav.features')}
                </Link>
                <Link href={`#pricing`} className='hover:text-primary text-sm font-medium'>
                  {t('nav.pricing')}
                </Link>
                <Link href={`#testimonials`} className='hover:text-primary text-sm font-medium'>
                  {t('nav.testimonials')}
                </Link>
                <Link href={`#faq`} className='hover:text-primary text-sm font-medium'>
                  {t('nav.faq')}
                </Link>
              </nav>
            </div>
            <div className='flex items-center gap-4'>
              <LocaleSwitcher />
              <Link href={`/${locale}/auth/signin`}>
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

      {/* Hero Section */}
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

      {/* Features Section */}
      <section id='features' className='bg-muted/50 py-20'>
        <div className='container mx-auto px-4'>
          <div className='mx-auto mb-12 max-w-4xl text-center'>
            <h2 className='mb-4 text-3xl font-bold tracking-tight sm:text-4xl'>
              {t('features.title')}
            </h2>
            <p className='text-muted-foreground text-lg'>{t('features.subtitle')}</p>
          </div>
          <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
            <Card>
              <CardHeader>
                <div className='bg-primary/10 mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg'>
                  <Smartphone className='text-primary h-6 w-6' />
                </div>
                <CardTitle>{t('features.mobile.title')}</CardTitle>
                <CardDescription>{t('features.mobile.description')}</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <div className='bg-primary/10 mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg'>
                  <Globe className='text-primary h-6 w-6' />
                </div>
                <CardTitle>{t('features.i18n.title')}</CardTitle>
                <CardDescription>{t('features.i18n.description')}</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <div className='bg-primary/10 mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg'>
                  <Shield className='text-primary h-6 w-6' />
                </div>
                <CardTitle>{t('features.security.title')}</CardTitle>
                <CardDescription>{t('features.security.description')}</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <div className='bg-primary/10 mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg'>
                  <Zap className='text-primary h-6 w-6' />
                </div>
                <CardTitle>{t('features.performance.title')}</CardTitle>
                <CardDescription>{t('features.performance.description')}</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <div className='bg-primary/10 mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg'>
                  <Users className='text-primary h-6 w-6' />
                </div>
                <CardTitle>{t('features.multitenancy.title')}</CardTitle>
                <CardDescription>{t('features.multitenancy.description')}</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <div className='bg-primary/10 mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg'>
                  <BarChart3 className='text-primary h-6 w-6' />
                </div>
                <CardTitle>{t('features.analytics.title')}</CardTitle>
                <CardDescription>{t('features.analytics.description')}</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id='pricing' className='py-20'>
        <div className='container mx-auto px-4'>
          <div className='mx-auto mb-12 max-w-4xl text-center'>
            <h2 className='mb-4 text-3xl font-bold tracking-tight sm:text-4xl'>
              {t('pricing.title')}
            </h2>
            <p className='text-muted-foreground text-lg'>{t('pricing.subtitle')}</p>
          </div>
          <div className='mx-auto grid max-w-5xl gap-6 md:grid-cols-3'>
            {/* Free Plan */}
            <Card>
              <CardHeader>
                <CardTitle>{t('pricing.free.title')}</CardTitle>
                <CardDescription>{t('pricing.free.description')}</CardDescription>
                <div className='mt-4'>
                  <span className='text-4xl font-bold'>{t('pricing.free.price')}</span>
                  <span className='text-muted-foreground'>/{t('pricing.free.period')}</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className='space-y-2'>
                  {['feature1', 'feature2', 'feature3'].map(feature => (
                    <li key={feature} className='flex items-center'>
                      <Check className='text-primary mr-2 h-4 w-4' />
                      <span className='text-sm'>{t(`pricing.free.features.${feature}`)}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Link href={`/${locale}/auth/signup`} className='w-full'>
                  <Button className='w-full' variant='outline'>
                    {t('pricing.free.cta')}
                  </Button>
                </Link>
              </CardFooter>
            </Card>

            {/* Pro Plan */}
            <Card className='border-primary relative'>
              <div className='absolute -top-3 left-1/2 -translate-x-1/2'>
                <Badge>{t('pricing.pro.badge')}</Badge>
              </div>
              <CardHeader>
                <CardTitle>{t('pricing.pro.title')}</CardTitle>
                <CardDescription>{t('pricing.pro.description')}</CardDescription>
                <div className='mt-4'>
                  <span className='text-4xl font-bold'>{t('pricing.pro.price')}</span>
                  <span className='text-muted-foreground'>/{t('pricing.pro.period')}</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className='space-y-2'>
                  {['feature1', 'feature2', 'feature3', 'feature4', 'feature5'].map(feature => (
                    <li key={feature} className='flex items-center'>
                      <Check className='text-primary mr-2 h-4 w-4' />
                      <span className='text-sm'>{t(`pricing.pro.features.${feature}`)}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Link href={`/${locale}/auth/signup`} className='w-full'>
                  <Button className='w-full'>{t('pricing.pro.cta')}</Button>
                </Link>
              </CardFooter>
            </Card>

            {/* Enterprise Plan */}
            <Card>
              <CardHeader>
                <CardTitle>{t('pricing.enterprise.title')}</CardTitle>
                <CardDescription>{t('pricing.enterprise.description')}</CardDescription>
                <div className='mt-4'>
                  <span className='text-4xl font-bold'>{t('pricing.enterprise.price')}</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className='space-y-2'>
                  {['feature1', 'feature2', 'feature3', 'feature4'].map(feature => (
                    <li key={feature} className='flex items-center'>
                      <Check className='text-primary mr-2 h-4 w-4' />
                      <span className='text-sm'>{t(`pricing.enterprise.features.${feature}`)}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button className='w-full' variant='outline'>
                  {t('pricing.enterprise.cta')}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id='testimonials' className='bg-muted/50 py-20'>
        <div className='container mx-auto px-4'>
          <div className='mx-auto mb-12 max-w-4xl text-center'>
            <h2 className='mb-4 text-3xl font-bold tracking-tight sm:text-4xl'>
              {t('testimonials.title')}
            </h2>
            <p className='text-muted-foreground text-lg'>{t('testimonials.subtitle')}</p>
          </div>
          <div className='mx-auto grid max-w-5xl gap-6 md:grid-cols-3'>
            {[1, 2, 3].map(i => (
              <Card key={i}>
                <CardHeader>
                  <CardDescription className='text-base'>
                    &ldquo;{t(`testimonials.items.${i}.quote`)}&rdquo;
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='flex items-center gap-4'>
                    <div className='bg-muted h-12 w-12 rounded-full' />
                    <div>
                      <p className='font-semibold'>{t(`testimonials.items.${i}.author`)}</p>
                      <p className='text-muted-foreground text-sm'>
                        {t(`testimonials.items.${i}.role`)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id='faq' className='py-20'>
        <div className='container mx-auto px-4'>
          <div className='mx-auto mb-12 max-w-4xl text-center'>
            <h2 className='mb-4 text-3xl font-bold tracking-tight sm:text-4xl'>{t('faq.title')}</h2>
            <p className='text-muted-foreground text-lg'>{t('faq.subtitle')}</p>
          </div>
          <div className='mx-auto max-w-3xl'>
            <Accordion type='single' collapsible className='w-full'>
              {[1, 2, 3, 4, 5].map(i => (
                <AccordionItem key={i} value={`item-${i}`}>
                  <AccordionTrigger>{t(`faq.items.${i}.question`)}</AccordionTrigger>
                  <AccordionContent>{t(`faq.items.${i}.answer`)}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* CTA Section */}
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

      {/* Footer */}
      <footer className='border-t py-12'>
        <div className='container mx-auto px-4'>
          <div className='grid gap-8 md:grid-cols-4'>
            <div>
              <h3 className='mb-4 text-lg font-semibold'>Works</h3>
              <p className='text-muted-foreground text-sm'>{t('footer.description')}</p>
            </div>
            <div>
              <h4 className='mb-4 text-sm font-semibold'>{t('footer.product.title')}</h4>
              <ul className='text-muted-foreground space-y-2 text-sm'>
                <li>
                  <Link href='#features' className='hover:text-foreground'>
                    {t('footer.product.features')}
                  </Link>
                </li>
                <li>
                  <Link href='#pricing' className='hover:text-foreground'>
                    {t('footer.product.pricing')}
                  </Link>
                </li>
                <li>
                  <Link href='#' className='hover:text-foreground'>
                    {t('footer.product.documentation')}
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className='mb-4 text-sm font-semibold'>{t('footer.company.title')}</h4>
              <ul className='text-muted-foreground space-y-2 text-sm'>
                <li>
                  <Link href='#' className='hover:text-foreground'>
                    {t('footer.company.about')}
                  </Link>
                </li>
                <li>
                  <Link href='#' className='hover:text-foreground'>
                    {t('footer.company.blog')}
                  </Link>
                </li>
                <li>
                  <Link href='#' className='hover:text-foreground'>
                    {t('footer.company.careers')}
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className='mb-4 text-sm font-semibold'>{t('footer.legal.title')}</h4>
              <ul className='text-muted-foreground space-y-2 text-sm'>
                <li>
                  <Link href='#' className='hover:text-foreground'>
                    {t('footer.legal.privacy')}
                  </Link>
                </li>
                <li>
                  <Link href='#' className='hover:text-foreground'>
                    {t('footer.legal.terms')}
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className='text-muted-foreground mt-8 border-t pt-8 text-center text-sm'>
            <p>{t('footer.copyright', { year: new Date().getFullYear() })}</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
