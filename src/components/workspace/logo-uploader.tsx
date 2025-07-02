'use client'

import { Upload, X } from 'lucide-react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { useState, useRef } from 'react'

import { Button } from '@/components/ui/button'

interface LogoUploaderProps {
  value: string | null | undefined
  onChange: (value: string | null) => void
  workspaceName: string
}

export function LogoUploader({ value, onChange, workspaceName }: LogoUploaderProps) {
  const t = useTranslations('workspace.settings.general')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      // TODO: Show error toast
      return
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      // TODO: Show error toast
      return
    }

    setIsUploading(true)
    try {
      // TODO: Implement actual file upload to storage
      // For now, we'll use a data URL (not recommended for production)
      const reader = new FileReader()
      reader.onloadend = () => {
        onChange(reader.result as string)
        setIsUploading(false)
      }
      reader.readAsDataURL(file)
    } catch {
      setIsUploading(false)
      // TODO: Show error toast
    }
  }

  const handleRemove = () => {
    onChange(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className='flex items-center gap-4'>
      <div className='relative'>
        {value !== null && value !== undefined && value !== '' ? (
          <div className='relative h-20 w-20 overflow-hidden rounded-lg'>
            <Image src={value} alt={workspaceName} fill className='object-cover' />
            <Button
              type='button'
              variant='destructive'
              size='icon'
              className='absolute -top-2 -right-2 h-6 w-6 rounded-full'
              onClick={handleRemove}
            >
              <X className='h-3 w-3' />
              <span className='sr-only'>{t('removeLogo')}</span>
            </Button>
          </div>
        ) : (
          <div className='bg-muted flex h-20 w-20 items-center justify-center rounded-lg'>
            <span className='text-muted-foreground text-xl font-semibold'>
              {getInitials(workspaceName)}
            </span>
          </div>
        )}
      </div>

      <div className='flex-1'>
        <input
          ref={fileInputRef}
          type='file'
          accept='image/*'
          onChange={e => void handleFileSelect(e)}
          className='sr-only'
          id='logo-upload'
        />
        <Button
          type='button'
          variant='outline'
          size='sm'
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          <Upload className='mr-2 h-4 w-4' />
          {value !== null && value !== undefined && value !== ''
            ? t('changeLogo')
            : t('uploadLogo')}
        </Button>
        <p className='text-muted-foreground mt-1 text-xs'>{t('logoRequirements')}</p>
      </div>
    </div>
  )
}
