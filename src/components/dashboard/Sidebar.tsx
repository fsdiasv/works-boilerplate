'use client'

import {
  Home,
  BarChart3,
  FileText,
  Users,
  Settings,
  Search,
  HelpCircle,
  MoreHorizontal,
  ChevronDown,
} from 'lucide-react'
import { useState } from 'react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Home', icon: Home, href: '/', active: false },
  { name: 'Dashboard', icon: BarChart3, href: '/dashboard', active: true },
  { name: 'Lifecycle', icon: FileText, href: '/lifecycle', active: false },
  { name: 'Analytics', icon: BarChart3, href: '/analytics', active: false },
  { name: 'Projects', icon: FileText, href: '/projects', active: false },
  { name: 'Team', icon: Users, href: '/team', active: false },
]

const documents = [
  { name: 'Data Library', icon: FileText, href: '/data-library', active: false },
  { name: 'Reports', icon: FileText, href: '/reports', active: false },
  { name: 'Word Assistant', icon: FileText, href: '/word-assistant', active: false },
  { name: 'More', icon: MoreHorizontal, href: '/more', active: false },
]

export function Sidebar() {
  const [isDocumentsOpen, setIsDocumentsOpen] = useState(true)

  return (
    <div className='hidden border-r border-gray-200 bg-white lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col dark:border-gray-700 dark:bg-gray-900'>
      {/* Company Logo */}
      <div className='flex items-center justify-between border-b border-gray-200 px-4 py-4 dark:border-gray-700'>
        <div className='flex items-center gap-2'>
          <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-black'>
            <span className='text-sm font-bold text-white'>A</span>
          </div>
          <span className='font-semibold text-gray-900 dark:text-white'>Acme Inc.</span>
        </div>
      </div>

      {/* Search */}
      <div className='px-4 py-4'>
        <div className='relative'>
          <Search className='absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400' />
          <Input
            placeholder='Search'
            className='h-9 border-gray-200 bg-gray-50 pl-10 dark:border-gray-700 dark:bg-gray-800'
          />
        </div>
      </div>

      {/* Navigation */}
      <nav className='flex-1 space-y-1 px-4'>
        {navigation.map(item => (
          <Button
            key={item.name}
            variant={item.active ? 'secondary' : 'ghost'}
            className={cn(
              'h-9 w-full justify-start px-3',
              item.active
                ? 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white'
            )}
            asChild
          >
            <a href={item.href}>
              <item.icon className='mr-3 h-4 w-4' />
              {item.name}
            </a>
          </Button>
        ))}

        {/* Documents Section */}
        <div className='pt-4'>
          <Button
            variant='ghost'
            className='h-9 w-full justify-between px-3 text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white'
            onClick={() => setIsDocumentsOpen(!isDocumentsOpen)}
          >
            <span className='text-xs font-medium tracking-wide uppercase'>Documents</span>
            <ChevronDown
              className={cn('h-4 w-4 transition-transform', isDocumentsOpen ? 'rotate-180' : '')}
            />
          </Button>

          {isDocumentsOpen && (
            <div className='mt-1 space-y-1'>
              {documents.map(item => (
                <Button
                  key={item.name}
                  variant='ghost'
                  className='h-9 w-full justify-start px-6 text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white'
                  asChild
                >
                  <a href={item.href}>
                    <item.icon className='mr-3 h-4 w-4' />
                    {item.name}
                  </a>
                </Button>
              ))}
            </div>
          )}
        </div>
      </nav>

      {/* User Profile */}
      <div className='border-t border-gray-200 p-4 dark:border-gray-700'>
        <div className='flex items-center gap-3'>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant='ghost'
                className='h-auto w-full justify-start p-2 hover:bg-gray-50 dark:hover:bg-gray-800'
              >
                <div className='flex flex-1 items-center gap-3'>
                  <Avatar className='h-8 w-8'>
                    <AvatarImage src='/placeholder-avatar.jpg' alt='User' />
                    <AvatarFallback className='bg-gray-200 text-xs dark:bg-gray-700'>
                      SH
                    </AvatarFallback>
                  </Avatar>
                  <div className='flex-1 text-left'>
                    <p className='text-sm font-medium text-gray-900 dark:text-white'>shadcn</p>
                    <p className='text-xs text-gray-500 dark:text-gray-400'>m@example.com</p>
                  </div>
                </div>
                <MoreHorizontal className='h-4 w-4 text-gray-400' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-56'>
              <DropdownMenuItem>
                <Settings className='mr-2 h-4 w-4' />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem>
                <HelpCircle className='mr-2 h-4 w-4' />
                Get Help
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Log out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}
