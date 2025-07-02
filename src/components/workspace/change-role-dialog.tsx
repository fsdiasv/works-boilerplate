'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { api } from '@/trpc/react'

interface ChangeRoleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  member: {
    userId: string
    role: string
    user: {
      fullName: string | null
      email: string
    }
  } | null
  workspaceId: string
}

export function ChangeRoleDialog({
  open,
  onOpenChange,
  member,
  workspaceId,
}: ChangeRoleDialogProps) {
  const t = useTranslations('workspace.settings.members')
  const [selectedRole, setSelectedRole] = useState<'admin' | 'member'>(
    member?.role === 'owner'
      ? 'admin'
      : member?.role === 'admin' || member?.role === 'member'
        ? member.role
        : 'member'
  )
  const utils = api.useUtils()

  const updateRole = api.members.updateRole.useMutation({
    onSuccess: () => {
      toast.success(t('updateSuccess'))
      void utils.members.list.invalidate()
      onOpenChange(false)
    },
    onError: error => {
      toast.error(error.message)
    },
  })

  const handleUpdateRole = () => {
    if (!member || selectedRole === member.role) return

    updateRole.mutate({
      workspaceId,
      userId: member.userId,
      role: selectedRole,
    })
  }

  if (!member) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('changeRole')}</DialogTitle>
          <DialogDescription>
            Change role for {member.user.fullName ?? member.user.email}
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4 py-4'>
          <div className='space-y-2'>
            <Label htmlFor='role'>Select new role</Label>
            <Select
              value={selectedRole}
              onValueChange={value => setSelectedRole(value as 'admin' | 'member')}
            >
              <SelectTrigger id='role'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='admin'>{t('admin')}</SelectItem>
                <SelectItem value='member'>{t('member')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleUpdateRole}
            disabled={selectedRole === member.role || updateRole.isPending}
          >
            {updateRole.isPending ? 'Updating...' : 'Update Role'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
