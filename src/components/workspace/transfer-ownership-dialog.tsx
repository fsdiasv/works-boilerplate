'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { toast } from 'sonner'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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

interface TransferOwnershipDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  members: Array<{
    userId: string
    user: {
      id: string
      fullName: string | null
      email: string
      avatarUrl: string | null
    }
  }>
  workspaceId: string
}

export function TransferOwnershipDialog({
  open,
  onOpenChange,
  members,
  workspaceId,
}: TransferOwnershipDialogProps) {
  const t = useTranslations('workspace.settings.members')
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const utils = api.useUtils()

  const transferOwnership = api.members.transferOwnership.useMutation({
    onSuccess: () => {
      toast.success(t('transferSuccess'))
      void utils.members.list.invalidate()
      void utils.workspace.getActive.invalidate()
      onOpenChange(false)
    },
    onError: error => {
      toast.error(error.message)
    },
  })

  const handleTransfer = () => {
    if (!selectedUserId) return

    const selectedMember = members.find(m => m.userId === selectedUserId)
    if (!selectedMember) return

    transferOwnership.mutate({
      workspaceId,
      newOwnerId: selectedUserId,
    })
  }

  const getInitials = (name: string | null, email: string) => {
    if (name !== null && name !== '') {
      return name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    return email.slice(0, 2).toUpperCase()
  }

  const selectedMember = members.find(m => m.userId === selectedUserId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('transferConfirmTitle')}</DialogTitle>
          <DialogDescription>
            {selectedMember
              ? t('transferConfirmDescription', {
                  name: selectedMember.user.fullName ?? selectedMember.user.email,
                })
              : 'Select a member to transfer ownership to'}
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4 py-4'>
          <div className='space-y-2'>
            <Label htmlFor='new-owner'>Select new owner</Label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger id='new-owner'>
                <SelectValue placeholder='Select a member' />
              </SelectTrigger>
              <SelectContent>
                {members.map(member => (
                  <SelectItem key={member.userId} value={member.userId}>
                    <div className='flex items-center gap-2'>
                      <Avatar className='h-6 w-6'>
                        <AvatarImage src={member.user.avatarUrl ?? undefined} />
                        <AvatarFallback className='text-xs'>
                          {getInitials(member.user.fullName, member.user.email)}
                        </AvatarFallback>
                      </Avatar>
                      <span>{member.user.fullName ?? member.user.email}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleTransfer}
            disabled={!selectedUserId || transferOwnership.isPending}
            variant='destructive'
          >
            {transferOwnership.isPending ? 'Transferring...' : 'Transfer Ownership'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
