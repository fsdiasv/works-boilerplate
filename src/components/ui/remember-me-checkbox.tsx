'use client'

import { Shield } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'

interface RememberMeCheckboxProps {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  showTrustBadge?: boolean
  className?: string
}

export function RememberMeCheckbox({
  checked,
  onCheckedChange,
  showTrustBadge = false,
  className,
}: RememberMeCheckboxProps) {
  const t = useTranslations('auth')

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <Checkbox
        id='remember-me'
        checked={checked}
        onCheckedChange={onCheckedChange}
        className='h-5 w-5'
        aria-label={t('rememberMe')}
      />
      <label
        htmlFor='remember-me'
        className='flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700 select-none'
      >
        {t('rememberMe')}
        {showTrustBadge && (
          <Shield className='h-4 w-4 text-green-600' aria-label={t('trustedDevice')} />
        )}
      </label>
    </div>
  )
}
