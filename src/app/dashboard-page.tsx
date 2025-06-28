import { AppSidebar } from '@/components/dashboard/app-sidebar'
import { TopNav } from '@/components/dashboard/top-nav'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function DashboardPage() {
  return (
    <div className='bg-muted/40 flex min-h-screen w-full flex-col dark:bg-slate-900/50'>
      <AppSidebar /> {/* [^4] */}
      <div className='flex flex-col transition-[padding-left] duration-200 ease-linear sm:gap-4 sm:py-4 sm:pl-14 group-data-[collapsible=icon]:sm:pl-[calc(var(--sidebar-width-icon)_+_theme(spacing.4)_+2px)] peer-data-[variant=inset]:sm:pl-0 peer-data-[variant=sidebar]:sm:pl-[var(--sidebar-width)]'>
        {/* TopNav includes the SidebarTrigger for mobile [^4] */}
        <TopNav />
        <main className='flex-1 gap-4 p-4 sm:px-6 sm:py-0 md:gap-8'>
          <div className='grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2'>
            <Card>
              <CardHeader>
                <CardTitle>Welcome to your Dashboard!</CardTitle>
                <CardDescription>
                  This is a sample content area. You can replace this with your actual dashboard
                  components.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className='mb-4'>
                  The sidebar is collapsible. On desktop, when collapsed, it shows only icons. On
                  mobile, it uses a sheet component. The top navigation bar includes theme toggle,
                  language switcher, notifications, and settings.
                </p>
                <Button>Get Started</Button>
              </CardContent>
            </Card>
            <div className='grid gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4'>
              {[1, 2, 3, 4].map(i => (
                <Card key={i}>
                  <CardHeader className='pb-2'>
                    <CardDescription>Metric {i}</CardDescription>
                    <CardTitle className='text-4xl'>1,234</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='text-muted-foreground text-xs'>+25% from last week</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
