import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

interface FooterProps {
  locale: string
}

export default async function Footer({ locale }: FooterProps) {
  const t = await getTranslations({ locale, namespace: 'landing' })

  return (
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
  )
}
