import { CreditCard, Package, Receipt } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function WorkspaceBillingPage() {
  const t = useTranslations('workspace.settings.billing')
  return (
    <div className='space-y-6'>
      <div>
        <h2 className='text-lg font-medium'>{t('title')}</h2>
        <p className='text-muted-foreground text-sm'>{t('description')}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Package className='h-5 w-5' />
            {t('currentPlan.title')}
          </CardTitle>
          <CardDescription>{t('currentPlan.description')}</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='font-medium'>{t('currentPlan.freePlan')}</p>
              <p className='text-muted-foreground text-sm'>
                {t('currentPlan.freePlanDescription')}
              </p>
            </div>
            <Button>{t('currentPlan.upgradePlan')}</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <CreditCard className='h-5 w-5' />
            {t('paymentMethod.title')}
          </CardTitle>
          <CardDescription>{t('paymentMethod.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className='text-muted-foreground text-sm'>{t('paymentMethod.noPaymentMethod')}</p>
          <Button variant='outline' className='mt-4'>
            {t('paymentMethod.addPaymentMethod')}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Receipt className='h-5 w-5' />
            {t('billingHistory.title')}
          </CardTitle>
          <CardDescription>{t('billingHistory.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className='text-muted-foreground text-sm'>{t('billingHistory.noBillingHistory')}</p>
        </CardContent>
      </Card>
    </div>
  )
}
