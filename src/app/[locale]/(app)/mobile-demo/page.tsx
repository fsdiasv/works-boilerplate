'use client'

import {
  Activity,
  CreditCard,
  DollarSign,
  Download,
  Users,
  TrendingUp,
  ShoppingCart,
  Package,
} from 'lucide-react'
import { useTranslations } from 'next-intl'

import { MobileLayout } from '@/components/mobile/mobile-layout'
import { SwipeNavigation } from '@/components/mobile/swipe-navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function MobileDemoPage() {
  const t = useTranslations()

  // Sample data for demo
  const stats = [
    {
      title: 'Total Revenue',
      value: '$45,231.89',
      description: '+20.1% from last month',
      icon: DollarSign,
      trend: 'up',
    },
    {
      title: 'Subscriptions',
      value: '+2350',
      description: '+180.1% from last month',
      icon: Users,
      trend: 'up',
    },
    {
      title: 'Sales',
      value: '+12,234',
      description: '+19% from last month',
      icon: CreditCard,
      trend: 'up',
    },
    {
      title: 'Active Now',
      value: '+573',
      description: '+201 since last hour',
      icon: Activity,
      trend: 'up',
    },
  ]

  const recentSales = [
    {
      name: 'Olivia Martin',
      email: 'olivia.martin@email.com',
      amount: '+$1,999.00',
      avatar: '/avatars/01.png',
    },
    {
      name: 'Jackson Lee',
      email: 'jackson.lee@email.com',
      amount: '+$39.00',
      avatar: '/avatars/02.png',
    },
    {
      name: 'Isabella Nguyen',
      email: 'isabella.nguyen@email.com',
      amount: '+$299.00',
      avatar: '/avatars/03.png',
    },
    {
      name: 'William Kim',
      email: 'will@email.com',
      amount: '+$99.00',
      avatar: '/avatars/04.png',
    },
    {
      name: 'Sofia Davis',
      email: 'sofia.davis@email.com',
      amount: '+$39.00',
      avatar: '/avatars/05.png',
    },
  ]

  const handleRefresh = async () => {
    // Simulate data refresh
    await new Promise(resolve => setTimeout(resolve, 2000))
  }

  return (
    <MobileLayout onRefresh={handleRefresh} headerVariant='default' hideHeaderOnScroll={true}>
      <div className='p-4 pb-20'>
        {/* Welcome Section */}
        <div className='mb-6'>
          <h1 className='text-2xl font-bold'>{t('dashboard.welcome')}</h1>
          <p className='text-muted-foreground'>Here&apos;s what&apos;s happening with your business today.</p>
        </div>

        {/* Stats Grid - Swipeable on mobile */}
        <div className='-mx-4 mb-6'>
          <SwipeNavigation indicators={true} className='px-4'>
            {stats.map((stat, index) => (
              <div key={index} className='px-4'>
                <Card className='touch-manipulation'>
                  <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                    <CardTitle className='text-sm font-medium'>{stat.title}</CardTitle>
                    <stat.icon className='text-muted-foreground h-4 w-4' />
                  </CardHeader>
                  <CardContent>
                    <div className='text-2xl font-bold'>{stat.value}</div>
                    <p className='text-muted-foreground text-xs'>{stat.description}</p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </SwipeNavigation>
        </div>

        {/* Quick Actions */}
        <div className='mb-6'>
          <h2 className='mb-3 text-lg font-semibold'>Quick Actions</h2>
          <div className='grid grid-cols-2 gap-3'>
            <Button variant='outline' className='h-auto flex-col gap-2 p-4'>
              <ShoppingCart className='h-5 w-5' />
              <span className='text-xs'>New Order</span>
            </Button>
            <Button variant='outline' className='h-auto flex-col gap-2 p-4'>
              <Package className='h-5 w-5' />
              <span className='text-xs'>Inventory</span>
            </Button>
            <Button variant='outline' className='h-auto flex-col gap-2 p-4'>
              <TrendingUp className='h-5 w-5' />
              <span className='text-xs'>Analytics</span>
            </Button>
            <Button variant='outline' className='h-auto flex-col gap-2 p-4'>
              <Download className='h-5 w-5' />
              <span className='text-xs'>Reports</span>
            </Button>
          </div>
        </div>

        {/* Recent Sales */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Sales</CardTitle>
            <CardDescription>You made 265 sales this month.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              {recentSales.map((sale, index) => (
                <div key={index} className='flex items-center'>
                  <Avatar className='h-9 w-9'>
                    <AvatarImage src={sale.avatar} alt={sale.name} />
                    <AvatarFallback>
                      {sale.name
                        .split(' ')
                        .map(n => n[0])
                        .join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className='ml-3 flex-1 space-y-1'>
                    <p className='text-sm leading-none font-medium'>{sale.name}</p>
                    <p className='text-muted-foreground text-sm'>{sale.email}</p>
                  </div>
                  <div className='font-medium'>{sale.amount}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Notifications Example */}
        <div className='mt-6 space-y-3'>
          <h2 className='text-lg font-semibold'>Recent Activity</h2>
          <div className='space-y-2'>
            <div className='flex items-center gap-3 rounded-lg border p-3'>
              <Badge variant='secondary' className='h-2 w-2 rounded-full p-0' />
              <div className='flex-1'>
                <p className='text-sm font-medium'>New subscription</p>
                <p className='text-muted-foreground text-xs'>2 minutes ago</p>
              </div>
            </div>
            <div className='flex items-center gap-3 rounded-lg border p-3'>
              <Badge className='h-2 w-2 rounded-full p-0' />
              <div className='flex-1'>
                <p className='text-sm font-medium'>Payment received</p>
                <p className='text-muted-foreground text-xs'>1 hour ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MobileLayout>
  )
}
