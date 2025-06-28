import { getTranslations } from 'next-intl/server'

import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'

interface TestimonialsSectionProps {
  locale: string
}

export default async function TestimonialsSection({ locale }: TestimonialsSectionProps) {
  const t = await getTranslations({ locale, namespace: 'landing' })

  return (
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
  )
}
