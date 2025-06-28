'use client'

import {
  BookOpen,
  Check,
  ChevronRight,
  CircleDollarSign,
  LogOut,
  MessageSquare,
  Monitor,
  Moon,
  Settings,
  Sun,
  Users,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { useTheme } from 'next-themes'
import * as React from 'react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useToast } from '@/components/ui/use-toast'
import { localeNames, type Locale } from '@/i18n/config'

// Mock user data - replace with actual data source
const user = {
  name: 'Fernando Dias',
  email: 'fsdias.v@gmail.com',
  avatar: '/placeholder.svg?height=40&width=40', // Placeholder avatar
  monthlyCredits: 1.04,
  purchasedCredits: 0.0,
  creditsResetInDays: 29,
}

// navLinks moved inside component to use translations

// Helper function to get user initials for avatar fallback
function getUserInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function UserSettingsMenu() {
  const { theme, setTheme } = useTheme()
  const { toast } = useToast()
  const locale = useLocale() as Locale
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = React.useTransition()
  const t = useTranslations('UserSettingsMenu')

  const navLinks = [
    { href: '/settings', icon: Settings, label: t('nav.settings') },
    { href: '/pricing', icon: CircleDollarSign, label: t('nav.pricing') },
    { href: '/documentation', icon: BookOpen, label: t('nav.documentation') },
    { href: '/community', icon: Users, label: t('nav.community') },
    { href: '/feedback', icon: MessageSquare, label: t('nav.feedback') },
  ]

  const handleLanguageChange = (newLocale: Locale) => {
    startTransition(() => {
      // Get the pathname without the current locale
      const pathSegments = pathname.split('/')
      const pathWithoutLocale = `/${pathSegments.slice(2).join('/')}` || '/'

      // Construct the new path with the new locale
      const newPath = `/${newLocale}${pathWithoutLocale}`

      // Navigate to the new path
      router.push(newPath)

      toast({
        title: t('toast.languageChanged'),
        description: t('toast.languageChangedDescription', { language: localeNames[newLocale] }),
      })
    })
  }

  const languages = [
    { code: 'en' as Locale, name: 'English' },
    { code: 'es' as Locale, name: 'Español' },
    { code: 'pt' as Locale, name: 'Português' },
  ]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          size='icon'
          className='text-sw-text-secondary hover:text-sw-text-primary'
        >
          <Settings className='h-[1.2rem] w-[1.2rem]' />
          <span className='sr-only'>{t('accessibility.openUserSettings')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-72 md:w-80' align='end' forceMount>
        <DropdownMenuLabel className='font-normal'>
          <div className='flex items-center space-x-3 py-2'>
            <Avatar className='h-10 w-10'>
              <AvatarImage src={user.avatar || '/placeholder.svg'} alt={user.name} />
              <AvatarFallback className='bg-sw-accent-purple text-primary-foreground font-semibold'>
                {getUserInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className='flex flex-col space-y-1'>
              <p className='text-sm leading-none font-semibold'>{user.name}</p>
              <p className='text-muted-foreground text-xs leading-none'>{user.email}</p>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {navLinks.map(link => (
            <DropdownMenuItem key={link.label} asChild>
              <Link href={`/${locale}${link.href}`} className='flex items-center'>
                <link.icon className='text-muted-foreground mr-2 h-4 w-4' />
                <span>{link.label}</span>
              </Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <div className='px-2 py-1.5'>
          <p className='text-foreground mb-1 text-xs font-semibold'>{t('creditBalance.title')}</p>
          <div className='text-muted-foreground mb-0.5 flex justify-between text-xs'>
            <span>{t('creditBalance.monthlyCredits')}</span>
            <span>{user.monthlyCredits.toFixed(2)}</span>
          </div>
          <div className='text-muted-foreground flex justify-between text-xs'>
            <span>{t('creditBalance.purchasedCredits')}</span>
            <span>{user.purchasedCredits.toFixed(2)}</span>
          </div>
        </div>
        <div className='mx-2 my-1.5 rounded-md bg-amber-50 p-2.5 text-xs text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'>
          {t('creditBalance.resetMessage', { days: user.creditsResetInDays })}{' '}
          <Link
            href={`/${locale}/pricing`}
            className='font-medium underline hover:text-amber-800 dark:hover:text-amber-300'
          >
            {t('creditBalance.buyMoreCredits')}
          </Link>
        </div>
        <div className='px-2 py-1.5'>
          <p className='text-foreground mb-2 text-xs font-semibold'>{t('preferences.title')}</p>
          <div className='mb-2 flex items-center justify-between'>
            <span className='text-muted-foreground text-sm'>{t('preferences.theme')}</span>
            <div className='flex items-center gap-1'>
              {[
                { value: 'light', icon: Sun },
                { value: 'system', icon: Monitor },
                { value: 'dark', icon: Moon },
              ].map(item => (
                <Button
                  key={item.value}
                  variant={theme === item.value ? 'secondary' : 'ghost'}
                  size='icon'
                  className='h-7 w-7'
                  onClick={() => setTheme(item.value)}
                >
                  <item.icon className='h-4 w-4' />
                </Button>
              ))}
            </div>
          </div>
          <div className='flex items-center justify-between'>
            <span className='text-muted-foreground text-sm'>{t('preferences.language')}</span>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className='h-8 px-2 py-1 text-xs' disabled={isPending}>
                <span>{localeNames[locale]}</span>
                <ChevronRight className='text-muted-foreground ml-2 h-3 w-3' />
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent>
                  {languages.map(lang => (
                    <DropdownMenuItem
                      key={lang.code}
                      onClick={() => handleLanguageChange(lang.code)}
                      disabled={isPending}
                    >
                      {lang.name}
                      {locale === lang.code && <Check className='ml-auto h-4 w-4' />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link
            href={`/${locale}/logout`}
            className='flex items-center text-red-600 hover:!text-red-700 dark:text-red-500 dark:hover:!text-red-400'
          >
            <LogOut className='mr-2 h-4 w-4' />
            <span>{t('signOut')}</span>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
