import { Smartphone, Globe, Shield, Zap, Users, BarChart3 } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

interface FeaturesSectionProps {
  locale: string
}

export default async function FeaturesSection({ locale }: FeaturesSectionProps) {
  const t = await getTranslations({ locale, namespace: 'landing' })

  const features = [
    {
      icon: Smartphone,
      titleKey: 'features.mobile.title',
      descriptionKey: 'features.mobile.description',
    },
    {
      icon: Globe,
      titleKey: 'features.i18n.title',
      descriptionKey: 'features.i18n.description',
    },
    {
      icon: Shield,
      titleKey: 'features.security.title',
      descriptionKey: 'features.security.description',
    },
    {
      icon: Zap,
      titleKey: 'features.performance.title',
      descriptionKey: 'features.performance.description',
    },
    {
      icon: Users,
      titleKey: 'features.multitenancy.title',
      descriptionKey: 'features.multitenancy.description',
    },
    {
      icon: BarChart3,
      titleKey: 'features.analytics.title',
      descriptionKey: 'features.analytics.description',
    },
  ]

  return (
    <section id='features' className='bg-muted/50 py-20'>
      <div className='container mx-auto px-4'>
        <div className='mx-auto mb-12 max-w-4xl text-center'>
          <h2 className='mb-4 text-3xl font-bold tracking-tight sm:text-4xl'>
            {t('features.title')}
          </h2>
          <p className='text-muted-foreground text-lg'>{t('features.subtitle')}</p>
        </div>
        <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <Card key={index}>
                <CardHeader>
                  <div className='bg-primary/10 mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg'>
                    <Icon className='text-primary h-6 w-6' />
                  </div>
                  <CardTitle>{t(feature.titleKey)}</CardTitle>
                  <CardDescription>{t(feature.descriptionKey)}</CardDescription>
                </CardHeader>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
