'use client'

import { formatDistanceToNow } from 'date-fns'
import { Mail, MoreHorizontal, Copy, RefreshCw, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { BulkInviteDialog } from '@/components/workspace/bulk-invite-dialog'
import { InviteMemberDialog } from '@/components/workspace/invite-member-dialog'
import { useWorkspace, useIsWorkspaceAdmin } from '@/contexts/workspace-context'
import { api } from '@/trpc/react'

export default function WorkspaceInvitationsPage() {
  const t = useTranslations('workspace.settings.invitations')
  const tMembers = useTranslations('workspace.settings.members')
  const { activeWorkspace } = useWorkspace()
  const isAdmin = useIsWorkspaceAdmin()
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [bulkInviteDialogOpen, setBulkInviteDialogOpen] = useState(false)

  const { data: invitations, isLoading } = api.invitation.list.useQuery(
    { workspaceId: activeWorkspace?.id ?? '' },
    { enabled: !!activeWorkspace }
  )

  const utils = api.useUtils()

  const resendInvitation = api.invitation.resend.useMutation({
    onSuccess: () => {
      toast.success(t('resendSuccess'))
      void utils.invitation.list.invalidate()
    },
    onError: error => {
      toast.error(error.message)
    },
  })

  const cancelInvitation = api.invitation.cancel.useMutation({
    onSuccess: () => {
      toast.success(t('cancelSuccess'))
      void utils.invitation.list.invalidate()
    },
    onError: error => {
      toast.error(error.message)
    },
  })

  const copyInvitationLink = async (token: string) => {
    const inviteUrl = `${window.location.origin}/invitation/${token}`
    try {
      // Check if clipboard API is available
      if (!('clipboard' in navigator)) {
        // Fallback for browsers without clipboard API
        const textArea = document.createElement('textarea')
        textArea.value = inviteUrl
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        try {
          document.execCommand('copy')
          toast.success(t('linkCopied'))
        } catch {
          toast.error(t('copyLinkError'))
        } finally {
          document.body.removeChild(textArea)
        }
        return
      }

      await navigator.clipboard.writeText(inviteUrl)
      toast.success(t('linkCopied'))
    } catch {
      toast.error(t('copyLinkError'))
    }
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'default'
      default:
        return 'secondary'
    }
  }

  const getStatusBadgeVariant = (expiresAt: Date) => {
    const now = new Date()
    return now > new Date(expiresAt) ? 'destructive' : 'outline'
  }

  if (!activeWorkspace) {
    return null
  }

  return (
    <div className='space-y-6'>
      <div>
        <h2 className='text-lg font-medium'>{t('title')}</h2>
        <p className='text-muted-foreground text-sm'>{t('description')}</p>
      </div>

      {isAdmin && (
        <div className='flex items-center gap-2'>
          <Button onClick={() => setInviteDialogOpen(true)}>
            <Mail className='mr-2 h-4 w-4' />
            {t('sendInvitation')}
          </Button>
          <Button variant='outline' onClick={() => setBulkInviteDialogOpen(true)}>
            {t('bulkInvite')}
          </Button>
        </div>
      )}

      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('email')}</TableHead>
              <TableHead>{t('role')}</TableHead>
              <TableHead>{t('invitedBy')}</TableHead>
              <TableHead>{t('expiresAt')}</TableHead>
              <TableHead>{t('status')}</TableHead>
              {isAdmin && <TableHead className='w-[70px]'>{t('actions')}</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className='h-4 w-32' />
                  </TableCell>
                  <TableCell>
                    <Skeleton className='h-6 w-20' />
                  </TableCell>
                  <TableCell>
                    <Skeleton className='h-4 w-24' />
                  </TableCell>
                  <TableCell>
                    <Skeleton className='h-4 w-24' />
                  </TableCell>
                  <TableCell>
                    <Skeleton className='h-6 w-16' />
                  </TableCell>
                  {isAdmin && (
                    <TableCell>
                      <Skeleton className='h-8 w-8' />
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : invitations?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isAdmin ? 6 : 5} className='text-muted-foreground text-center'>
                  {t('noInvitations')}
                </TableCell>
              </TableRow>
            ) : (
              invitations?.map(invitation => {
                const isExpired = new Date() > new Date(invitation.expiresAt)
                return (
                  <TableRow key={invitation.id}>
                    <TableCell className='font-medium'>{invitation.email}</TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(invitation.role)}>
                        {tMembers(invitation.role)}
                      </Badge>
                    </TableCell>
                    <TableCell className='text-muted-foreground'>
                      {invitation.invitedBy.fullName ?? invitation.invitedBy.email}
                    </TableCell>
                    <TableCell className='text-muted-foreground'>
                      {formatDistanceToNow(new Date(invitation.expiresAt), { addSuffix: true })}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(invitation.expiresAt)}>
                        {isExpired ? t('expired') : t('pending')}
                      </Badge>
                    </TableCell>
                    {isAdmin && (
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant='ghost' size='icon' className='h-8 w-8'>
                              <MoreHorizontal className='h-4 w-4' />
                              <span className='sr-only'>{t('openMenu')}</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align='end'>
                            <DropdownMenuItem
                              onClick={() => void copyInvitationLink(invitation.token)}
                            >
                              <Copy className='mr-2 h-4 w-4' />
                              {t('copyLink')}
                            </DropdownMenuItem>
                            {!isExpired && (
                              <>
                                <DropdownMenuItem
                                  onClick={() =>
                                    resendInvitation.mutate({
                                      invitationId: invitation.id,
                                    })
                                  }
                                  disabled={resendInvitation.isPending}
                                >
                                  <RefreshCw className='mr-2 h-4 w-4' />
                                  {t('resend')}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                              </>
                            )}
                            <DropdownMenuItem
                              onClick={() =>
                                cancelInvitation.mutate({
                                  invitationId: invitation.id,
                                })
                              }
                              disabled={cancelInvitation.isPending}
                              className='text-destructive'
                            >
                              <X className='mr-2 h-4 w-4' />
                              {t('cancel')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialogs */}
      <InviteMemberDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        workspaceId={activeWorkspace.id}
      />

      <BulkInviteDialog
        open={bulkInviteDialogOpen}
        onOpenChange={setBulkInviteDialogOpen}
        workspaceId={activeWorkspace.id}
      />
    </div>
  )
}
