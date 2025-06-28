import { getTranslations } from 'next-intl/server'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

interface FAQSectionProps {
  locale: string
}

export default async function FAQSection({ locale }: FAQSectionProps) {
  const t = await getTranslations({ locale, namespace: 'landing' })

  return (
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
  )
}
