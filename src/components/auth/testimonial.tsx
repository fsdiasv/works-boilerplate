import { useTranslations } from 'next-intl'

export function Testimonial() {
  const t = useTranslations('auth.testimonial')

  return (
    <div className="h-full flex items-center justify-center p-8">
      <div className="max-w-md">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center">
              <span className="text-white font-bold text-lg">P</span>
            </div>
          </div>
          <div>
            <div className="mb-4">
              <h3 className="font-bold text-slate-800">{t('author.name')}</h3>
              <p className="text-sm text-slate-500">{t('author.title')}</p>
            </div>
            <p className="text-slate-800 leading-relaxed">
              {t.rich('quote', {
                highlight: (chunks) => (
                  <span className="bg-orange-100 px-1 py-0.5 rounded">
                    {chunks}
                  </span>
                )
              })}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}