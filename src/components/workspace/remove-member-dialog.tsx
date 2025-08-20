'use client'

import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { api } from '@/trpc/react'

interface RemoveMemberDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  member: {
    userId: string
    user: {
      fullName: string | null
      email: string
    }
  } | null
  workspaceId: string
  isLeavingWorkspace?: boolean
}

export function RemoveMemberDialog({
  open,
  onOpenChange,
  member,
  workspaceId,
  isLeavingWorkspace = false,
}: RemoveMemberDialogProps) {
  const t = useTranslations('workspace.settings.members')
  const utils = api.useUtils()

  const removeMutation = api.members.remove.useMutation({
    onSuccess: () => {
      toast.success(t('removeSuccess'))
      void utils.members.list.invalidate()
      onOpenChange(false)
    },
    onError: error => {
      toast.error(error.message)
    },
  })

  const leaveMutation = api.members.leave.useMutation({
    onSuccess: () => {
      toast.success(t('leaveSuccess'))
      void utils.members.list.invalidate()
      onOpenChange(false)
    },
    onError: error => {
      toast.error(error.message)
    },
  })

  const handleRemove = () => {
    if (!member) return

    if (isLeavingWorkspace) {
      leaveMutation.mutate({
        workspaceId,
      })
    } else {
      removeMutation.mutate({
        workspaceId,
        userId: member.userId,
      })
    }
  }

  if (!member) return null

  const title = isLeavingWorkspace ? t('leaveConfirmTitle') : t('removeConfirmTitle')
  const description = isLeavingWorkspace
    ? t('leaveConfirmDescription')
    : t('removeConfirmDescription', { name: member.user.fullName ?? member.user.email })

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleRemove}
            disabled={removeMutation.isPending || leaveMutation.isPending}
            className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
          >
            {removeMutation.isPending || leaveMutation.isPending
              ? t('removing')
              : isLeavingWorkspace
                ? t('leave')
                : t('remove')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
