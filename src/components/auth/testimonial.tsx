import { useTranslations } from 'next-intl'

export function Testimonial() {
  const t = useTranslations('auth.testimonial')

  return (
    <div className='flex h-full items-center justify-center p-8'>
      <div className='max-w-md'>
        <div className='flex items-start space-x-4'>
          <div className='flex-shrink-0'>
            <div className='flex h-12 w-12 items-center justify-center rounded-full bg-orange-500'>
              <span className='text-lg font-bold text-white'>P</span>
            </div>
          </div>
          <div>
            <div className='mb-4'>
              <h3 className='font-bold text-slate-800'>{t('author.name')}</h3>
              <p className='text-sm text-slate-500'>{t('author.title')}</p>
            </div>
            <p className='leading-relaxed text-slate-800'>
              {t.rich('quote', {
                highlight: chunks => (
                  <span className='rounded bg-orange-100 px-1 py-0.5'>{chunks}</span>
                ),
              })}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
