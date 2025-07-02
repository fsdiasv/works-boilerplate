'use client'

import { type Workspace } from '@prisma/client'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { toast } from 'sonner'

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api } from '@/trpc/react'

interface DeleteWorkspaceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspace: Workspace
}

export function DeleteWorkspaceDialog({
  open,
  onOpenChange,
  workspace,
}: DeleteWorkspaceDialogProps) {
  const t = useTranslations('workspace.settings.danger')
  const router = useRouter()
  const [confirmText, setConfirmText] = useState('')

  const deleteWorkspace = api.workspace.delete.useMutation({
    onSuccess: () => {
      toast.success(t('deleteSuccess'))
      router.push('/dashboard')
    },
    onError: error => {
      toast.error(error.message)
    },
  })

  const handleDelete = () => {
    if (confirmText !== 'DELETE') return

    deleteWorkspace.mutate({
      workspaceId: workspace.id,
      confirmation: 'DELETE',
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('deleteConfirmTitle')}</AlertDialogTitle>
          <AlertDialogDescription className='space-y-4'>
            <p>{t('deleteConfirmDescription', { workspace: workspace.name })}</p>
            <div className='space-y-2'>
              <Label htmlFor='confirm-delete' className='text-sm font-medium'>
                {t('deleteConfirmInput')}
              </Label>
              <Input
                id='confirm-delete'
                value={confirmText}
                onChange={e => setConfirmText(e.target.value)}
                placeholder='DELETE'
                className='font-mono'
              />
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button
            variant='outline'
            onClick={() => {
              setConfirmText('')
              onOpenChange(false)
            }}
          >
            Cancel
          </Button>
          <Button
            variant='destructive'
            onClick={handleDelete}
            disabled={confirmText !== 'DELETE' || deleteWorkspace.isPending}
          >
            {deleteWorkspace.isPending ? 'Deleting...' : 'Delete Workspace'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
