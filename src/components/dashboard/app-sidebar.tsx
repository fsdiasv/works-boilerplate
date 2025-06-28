'use client'
import {
  Calendar,
  Camera,
  CreditCard,
  Edit3,
  Home,
  KeyRound,
  Search,
  User,
  Zap,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
  useSidebar,
} from '@/components/ui/sidebar'
import { cn } from 'src/lib/utils'

import { DesktopSidebarToggle } from './desktop-sidebar-toggle'

const menuPrincipal = [
  { href: '/dashboard', icon: Home, label: 'Dashboard' },
  { href: '/radar', icon: Search, label: 'Radar de Conteúdo' },
  { href: '/criar-post', icon: Edit3, label: 'Criar Post' },
  { href: '/calendario', icon: Calendar, label: 'Calendário' },
]

const configuracoes = [
  { href: '/perfil', icon: User, label: 'Perfil' },
  { href: '/contas-sociais', icon: Camera, label: 'Contas Sociais' },
  { href: '/chaves-api', icon: KeyRound, label: 'Chaves de API' },
  { href: '/faturamento', icon: CreditCard, label: 'Faturamento' },
]

export function AppSidebar() {
  const pathname = usePathname()
  const locale = useLocale()
  const t = useTranslations('common')
  const { state, isMobile } = useSidebar()
  const isCollapsed = state === 'collapsed' && !isMobile

  // Remove locale prefix from pathname for comparison
  const pathSegments = pathname.split('/')
  const pathnameWithoutLocale = `/${pathSegments.slice(2).join('/')}` || '/dashboard'

  const renderMenuItems = (items: typeof menuPrincipal) => {
    return items.map(item => {
      const isActive = pathnameWithoutLocale === item.href
      return (
        <SidebarMenuItem key={item.label}>
          <SidebarMenuButton
            asChild
            className={cn(
              // Base styles
              'text-sw-sidebar-foreground relative transition-all duration-200',
              // Hover styles - more noticeable with opacity change
              'hover:bg-sw-sidebar-active-background/15 hover:text-sw-text-primary',
              // Active styles - enhanced with left border and font weight
              'data-[active=true]:bg-sw-sidebar-active-background/10 data-[active=true]:text-sw-sidebar-active-foreground data-[active=true]:font-medium',
              // Active indicator - left border
              'before:bg-sw-accent-purple before:absolute before:top-0 before:left-0 before:h-full before:w-0 before:transition-all',
              'data-[active=true]:before:w-1'
            )}
            isActive={isActive}
            tooltip={{
              children: item.label,
              side: 'right',
              align: 'center',
              hidden: !isCollapsed || isMobile,
            }}
          >
            <Link href={`/${locale}${item.href}`} className='flex items-center gap-3'>
              <item.icon
                className={cn('h-5 w-5 flex-shrink-0', isActive && 'text-sw-accent-purple')}
              />
              <span
                className={cn(
                  'transition-all',
                  isCollapsed && 'sr-only',
                  isActive && 'text-sw-text-primary'
                )}
              >
                {item.label}
              </span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      )
    })
  }

  return (
    <Sidebar
      collapsible='icon'
      className='group/sidebar border-border bg-sw-sidebar-background text-sw-sidebar-foreground border-r'
    >
      <SidebarHeader
        className={cn(
          'relative items-center', // Added relative for absolute positioning of toggle button
          isCollapsed
            ? 'flex flex-row justify-center p-2' // Collapsed: explicit flex-row, center content, smaller padding
            : 'flex flex-row justify-between p-4' // Expanded: explicit flex-row, space between, standard padding
        )}
      >
        {isCollapsed ? (
          // Only show logo when collapsed
          <Link href={`/${locale}/dashboard`} className='flex items-center justify-center'>
            <div className='bg-sw-accent-purple flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg'>
              <Zap className='text-primary-foreground h-5 w-5' />
            </div>
          </Link>
        ) : (
          // Show logo + text when expanded
          <Link href={`/${locale}/dashboard`} className='flex items-center gap-2 overflow-hidden'>
            <div className='bg-sw-accent-purple flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg'>
              <Zap className='text-primary-foreground h-5 w-5' />
            </div>
            <span className='text-sw-text-primary text-lg font-semibold whitespace-nowrap'>
              Works-Boilerplate
            </span>
          </Link>
        )}

        {/* Toggle button - absolutely positioned and only visible on hover */}
        <div
          className={cn(
            'pointer-events-none absolute opacity-0 transition-opacity duration-200 group-hover/sidebar:pointer-events-auto group-hover/sidebar:opacity-100',
            isCollapsed
              ? 'top-2 right-2' // Position when collapsed
              : 'top-4 right-4' // Position when expanded
          )}
        >
          <DesktopSidebarToggle />
        </div>
      </SidebarHeader>
      <SidebarContent className='flex-grow'>
        <SidebarGroup>
          <SidebarGroupLabel
            className={cn(
              'text-sw-sidebar-muted-foreground px-3 py-2 text-xs uppercase',
              isCollapsed && 'hidden'
            )}
          >
            {t('navigation.mainMenu')}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderMenuItems(menuPrincipal)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarSeparator className='border-border my-2' />
        <SidebarGroup>
          <SidebarGroupLabel
            className={cn(
              'text-sw-sidebar-muted-foreground px-3 py-2 text-xs uppercase',
              isCollapsed && 'hidden'
            )}
          >
            {t('navigation.settings')}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderMenuItems(configuracoes)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className='border-border mt-auto border-t p-4'>
        {!isCollapsed && (
          <p className='text-sw-sidebar-muted-foreground w-full text-center text-xs'>
            © {new Date().getFullYear()} Works-Boilerplate
          </p>
        )}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
