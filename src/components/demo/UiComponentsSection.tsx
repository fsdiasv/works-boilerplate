import { Menu } from 'lucide-react'

import { Typography } from '@/components/layout'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface UiComponentsSectionProps {
  onOpenDrawer: () => void
}

export function UiComponentsSection({ onOpenDrawer }: UiComponentsSectionProps) {
  return (
    <section className='mb-12'>
      <Typography variant='h2' className='mb-6 text-center font-semibold'>
        UI Components
      </Typography>
      <div className='grid gap-6 md:grid-cols-2'>
        {/* Navigation Demo */}
        <Card>
          <CardHeader>
            <CardTitle>Navigation</CardTitle>
            <CardDescription>Drawer and Bottom Tab examples</CardDescription>
          </CardHeader>
          <CardContent className='flex flex-col items-center justify-center space-y-4 pt-4'>
            <Button onClick={onOpenDrawer} className='w-full max-w-xs'>
              <Menu className='mr-2 h-4 w-4' />
              Open Drawer
            </Button>
            <p className='text-muted-foreground text-center text-sm'>
              Also, check the Bottom Tab Navigation.
            </p>
          </CardContent>
        </Card>

        {/* Other Components */}
        <Card>
          <CardHeader>
            <CardTitle>Avatars & Badges</CardTitle>
            <CardDescription>Showcasing user elements</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='flex flex-wrap items-center justify-center gap-4'>
              <Avatar>
                <AvatarFallback>AB</AvatarFallback>
              </Avatar>
              <Avatar>
                <AvatarImage src='/placeholder-avatar.jpg' alt='User' />
                <AvatarFallback>CD</AvatarFallback>
              </Avatar>
              <Badge>New</Badge>
              <Badge variant='destructive'>Urgent</Badge>
              <Badge variant='outline'>Draft</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
