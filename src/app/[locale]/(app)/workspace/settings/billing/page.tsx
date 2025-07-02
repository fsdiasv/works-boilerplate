import { CreditCard, Package, Receipt } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function WorkspaceBillingPage() {
  return (
    <div className='space-y-6'>
      <div>
        <h2 className='text-lg font-medium'>Billing</h2>
        <p className='text-muted-foreground text-sm'>
          Manage your workspace subscription and billing
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Package className='h-5 w-5' />
            Current Plan
          </CardTitle>
          <CardDescription>You&apos;re currently on the Free plan</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='font-medium'>Free Plan</p>
              <p className='text-muted-foreground text-sm'>Up to 3 members</p>
            </div>
            <Button>Upgrade Plan</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <CreditCard className='h-5 w-5' />
            Payment Method
          </CardTitle>
          <CardDescription>Manage your payment methods</CardDescription>
        </CardHeader>
        <CardContent>
          <p className='text-muted-foreground text-sm'>No payment method on file</p>
          <Button variant='outline' className='mt-4'>
            Add Payment Method
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Receipt className='h-5 w-5' />
            Billing History
          </CardTitle>
          <CardDescription>View your past invoices</CardDescription>
        </CardHeader>
        <CardContent>
          <p className='text-muted-foreground text-sm'>No billing history available</p>
        </CardContent>
      </Card>
    </div>
  )
}
