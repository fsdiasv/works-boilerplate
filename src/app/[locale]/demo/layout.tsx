import type { ReactNode } from 'react'

import { AppLayout } from '@/components/layout/AppLayout'
import { BottomTabNavigation } from '@/components/navigation/BottomTabNavigation'
import { SmartHeader } from '@/components/navigation/SmartHeader'

type Props = {
  children: ReactNode
}

export default function DemoLayout({ children }: Props) {
  return (
    <AppLayout variant='standalone'>
      <SmartHeader title='Layout Demo' variant='blurred' behavior='sticky' />
      <main className='flex-1 pb-20'>{children}</main>
      <BottomTabNavigation />
    </AppLayout>
  )
}
