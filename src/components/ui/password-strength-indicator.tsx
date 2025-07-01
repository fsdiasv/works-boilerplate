'use client'

import { useTranslations } from 'next-intl'
import { useMemo } from 'react'

import { cn } from '@/lib/utils'

interface PasswordStrengthIndicatorProps {
  password: string
  className?: string
}

interface StrengthResult {
  score: number
  label: string
  color: string
  percentage: number
}

function calculatePasswordStrength(password: string): StrengthResult {
  let score = 0

  // Length check
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (password.length >= 16) score++

  // Character variety checks
  if (/[a-z]/.test(password)) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^a-zA-Z0-9]/.test(password)) score++

  // Pattern checks
  if (!/(.)\1{2,}/.test(password)) score++ // No repeated characters
  if (!/^[0-9]+$/.test(password) && !/^[a-zA-Z]+$/.test(password)) score++ // Not only numbers or letters

  // Determine strength level
  const percentage = Math.min((score / 9) * 100, 100)

  if (score <= 2) {
    return { score, label: 'weak', color: 'bg-red-500', percentage }
  } else if (score <= 4) {
    return { score, label: 'fair', color: 'bg-orange-500', percentage }
  } else if (score <= 6) {
    return { score, label: 'good', color: 'bg-yellow-500', percentage }
  } else if (score <= 8) {
    return { score, label: 'strong', color: 'bg-green-500', percentage }
  } else {
    return { score, label: 'veryStrong', color: 'bg-green-600', percentage }
  }
}

export function PasswordStrengthIndicator({ password, className }: PasswordStrengthIndicatorProps) {
  const t = useTranslations('components.passwordStrength')

  const strength = useMemo(() => calculatePasswordStrength(password), [password])

  if (!password) return null

  return (
    <div className={cn('space-y-2', className)}>
      {/* Strength bar */}
      <div className='relative h-2 w-full overflow-hidden rounded-full bg-slate-200'>
        <div
          className={cn(
            'absolute inset-y-0 left-0 transition-all duration-300 ease-out',
            strength.color
          )}
          style={{ width: `${strength.percentage}%` }}
          role='progressbar'
          aria-valuenow={strength.percentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={t('strengthLevel', { level: t(strength.label) })}
        />
      </div>

      {/* Strength label */}
      <div className='flex items-center justify-between'>
        <span className='text-xs text-slate-600'>
          {t('strength')}: <span className='font-medium'>{t(strength.label)}</span>
        </span>

        {/* Requirements hint */}
        {strength.score < 6 && <span className='text-xs text-slate-500'>{t('hint')}</span>}
      </div>

      {/* Requirements checklist for weak passwords */}
      {strength.score < 4 && password.length > 0 && (
        <ul className='mt-2 space-y-1 text-xs text-slate-600'>
          <li className={cn('flex items-center gap-1', password.length >= 8 && 'text-green-600')}>
            <span className='text-lg leading-none'>{password.length >= 8 ? '✓' : '○'}</span>
            {t('requirements.length')}
          </li>
          <li className={cn('flex items-center gap-1', /[A-Z]/.test(password) && 'text-green-600')}>
            <span className='text-lg leading-none'>{/[A-Z]/.test(password) ? '✓' : '○'}</span>
            {t('requirements.uppercase')}
          </li>
          <li className={cn('flex items-center gap-1', /[a-z]/.test(password) && 'text-green-600')}>
            <span className='text-lg leading-none'>{/[a-z]/.test(password) ? '✓' : '○'}</span>
            {t('requirements.lowercase')}
          </li>
          <li className={cn('flex items-center gap-1', /[0-9]/.test(password) && 'text-green-600')}>
            <span className='text-lg leading-none'>{/[0-9]/.test(password) ? '✓' : '○'}</span>
            {t('requirements.number')}
          </li>
        </ul>
      )}
    </div>
  )
}
