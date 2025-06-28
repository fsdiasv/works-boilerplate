import { Check } from 'lucide-react'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

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

interface PricingSectionProps {
  locale: string
}

export default async function PricingSection({ locale }: PricingSectionProps) {
  const t = await getTranslations({ locale, namespace: 'landing' })

  const plans = [
    {
      name: 'free',
      features: ['feature1', 'feature2', 'feature3'],
      highlighted: false,
    },
    {
      name: 'pro',
      features: ['feature1', 'feature2', 'feature3', 'feature4', 'feature5'],
      highlighted: true,
    },
    {
      name: 'enterprise',
      features: ['feature1', 'feature2', 'feature3', 'feature4'],
      highlighted: false,
    },
  ]

  return (
    <section id='pricing' className='py-20'>
      <div className='container mx-auto px-4'>
        <div className='mx-auto mb-12 max-w-4xl text-center'>
          <h2 className='mb-4 text-3xl font-bold tracking-tight sm:text-4xl'>
            {t('pricing.title')}
          </h2>
          <p className='text-muted-foreground text-lg'>{t('pricing.subtitle')}</p>
        </div>
        <div className='mx-auto grid max-w-5xl gap-6 md:grid-cols-3'>
          {plans.map(plan => (
            <Card key={plan.name} className={plan.highlighted ? 'border-primary relative' : ''}>
              {plan.highlighted && (
                <div className='absolute -top-3 left-1/2 -translate-x-1/2'>
                  <Badge>{t(`pricing.${plan.name}.badge`)}</Badge>
                </div>
              )}
              <CardHeader>
                <CardTitle>{t(`pricing.${plan.name}.title`)}</CardTitle>
                <CardDescription>{t(`pricing.${plan.name}.description`)}</CardDescription>
                <div className='mt-4'>
                  <span className='text-4xl font-bold'>{t(`pricing.${plan.name}.price`)}</span>
                  {plan.name !== 'enterprise' && (
                    <span className='text-muted-foreground'>
                      /{t(`pricing.${plan.name}.period`)}
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <ul className='space-y-2'>
                  {plan.features.map(feature => (
                    <li key={feature} className='flex items-center'>
                      <Check className='text-primary mr-2 h-4 w-4' />
                      <span className='text-sm'>
                        {t(`pricing.${plan.name}.features.${feature}`)}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                {plan.name === 'enterprise' ? (
                  <Button className='w-full' variant='outline'>
                    {t(`pricing.${plan.name}.cta`)}
                  </Button>
                ) : (
                  <Link href={`/${locale}/auth/signup`} className='w-full'>
                    <Button className='w-full' variant={plan.highlighted ? 'default' : 'outline'}>
                      {t(`pricing.${plan.name}.cta`)}
                    </Button>
                  </Link>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
