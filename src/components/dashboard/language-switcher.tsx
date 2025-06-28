'use client'

import { Languages } from 'lucide-react'
import * as React from 'react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { useToast } from '@/components/ui/use-toast'

export function LanguageSwitcher() {
  const { toast } = useToast()
  const [selectedLanguage, setSelectedLanguage] = React.useState('English')

  const handleLanguageChange = (language: string) => {
    setSelectedLanguage(language)
    toast({
      title: 'Language Changed',
      description: `Switched to ${language}. (Demo - no actual change)`,
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' size='icon'>
          <Languages className='h-[1.2rem] w-[1.2rem]' />
          <span className='sr-only'>Select language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        <DropdownMenuLabel>Language</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleLanguageChange('English')}>
          English {selectedLanguage === 'English' && '✓'}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleLanguageChange('Español')}>
          Español {selectedLanguage === 'Español' && '✓'}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleLanguageChange('Français')}>
          Français {selectedLanguage === 'Français' && '✓'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
