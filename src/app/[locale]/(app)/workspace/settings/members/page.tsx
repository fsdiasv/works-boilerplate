'use client'

import { type WorkspaceRole } from '@prisma/client'
import { formatDistanceToNow } from 'date-fns'
import { Search, UserPlus, MoreHorizontal } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ChangeRoleDialog } from '@/components/workspace/change-role-dialog'
import { InviteMemberDialog } from '@/components/workspace/invite-member-dialog'
import { RemoveMemberDialog } from '@/components/workspace/remove-member-dialog'
import { TransferOwnershipDialog } from '@/components/workspace/transfer-ownership-dialog'
import { useAuth } from '@/contexts/auth-context'
import {
  useWorkspace,
  useIsWorkspaceOwner,
  useIsWorkspaceAdmin,
} from '@/contexts/workspace-context'
import { getInitials } from '@/lib/utils/get-initials'
import { api } from '@/trpc/react'

export default function WorkspaceMembersPage() {
  const t = useTranslations('workspace.settings.members')
  const { activeWorkspace } = useWorkspace()
  const { session } = useAuth()
  const isOwner = useIsWorkspaceOwner()
  const isAdmin = useIsWorkspaceAdmin()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMember, setSelectedMember] = useState<{
    userId: string
    workspaceId: string
    role: WorkspaceRole
    joinedAt: Date
    user: {
      id: string
      email: string
      fullName: string | null
      avatarUrl: string | null
      lastActiveAt: Date
    }
  } | null>(null)
  const [dialogState, setDialogState] = useState<{
    type: 'remove' | 'transfer' | 'invite' | 'changeRole' | null
    open: boolean
  }>({ type: null, open: false })

  const { data, isLoading } = api.members.list.useQuery(
    { workspaceId: activeWorkspace?.id ?? '' },
    { enabled: !!activeWorkspace }
  )

  const members = data?.members ?? []
  const filteredMembers = members.filter(
    member =>
      (member.user.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      member.user.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'owner':
        return 'destructive'
      case 'admin':
        return 'default'
      default:
        return 'secondary'
    }
  }

  const openDialog = (type: typeof dialogState.type, member?: typeof selectedMember) => {
    setSelectedMember(member ?? null)
    setDialogState({ type, open: true })
  }

  const closeDialog = () => {
    setDialogState({ type: null, open: false })
    setSelectedMember(null)
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

      <div className='flex items-center justify-between gap-4'>
        <div className='relative max-w-sm flex-1'>
          <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
          <Input
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className='pl-9'
          />
        </div>
        {isAdmin && (
          <Button onClick={() => openDialog('invite')}>
            <UserPlus className='mr-2 h-4 w-4' />
            {t('inviteMember')}
          </Button>
        )}
      </div>

      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('member')}</TableHead>
              <TableHead>{t('role')}</TableHead>
              <TableHead>{t('joinedAt')}</TableHead>
              {isAdmin && <TableHead className='w-[70px]'>{t('actions')}</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className='flex items-center gap-3'>
                      <Skeleton className='h-10 w-10 rounded-full' />
                      <div className='space-y-2'>
                        <Skeleton className='h-4 w-32' />
                        <Skeleton className='h-3 w-24' />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Skeleton className='h-6 w-20' />
                  </TableCell>
                  <TableCell>
                    <Skeleton className='h-4 w-24' />
                  </TableCell>
                  {isAdmin && (
                    <TableCell>
                      <Skeleton className='h-8 w-8' />
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : filteredMembers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isAdmin ? 4 : 3} className='text-muted-foreground text-center'>
                  {searchQuery ? 'No members found' : 'No members yet'}
                </TableCell>
              </TableRow>
            ) : (
              filteredMembers.map(member => (
                <TableRow key={`${member.userId}-${member.workspaceId}`}>
                  <TableCell>
                    <div className='flex items-center gap-3'>
                      <Avatar>
                        <AvatarImage src={member.user.avatarUrl ?? undefined} />
                        <AvatarFallback>
                          {getInitials(member.user.fullName, member.user.email)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className='font-medium'>
                          {member.user.fullName ?? member.user.email}
                        </div>
                        {member.user.fullName !== null && member.user.fullName !== '' && (
                          <div className='text-muted-foreground text-sm'>{member.user.email}</div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(member.role)}>{t(member.role)}</Badge>
                  </TableCell>
                  <TableCell className='text-muted-foreground'>
                    {formatDistanceToNow(new Date(member.joinedAt), { addSuffix: true })}
                  </TableCell>
                  {isAdmin && (
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant='ghost' size='icon' className='h-8 w-8'>
                            <MoreHorizontal className='h-4 w-4' />
                            <span className='sr-only'>Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end'>
                          {isOwner && member.role !== 'owner' && (
                            <>
                              <DropdownMenuItem onClick={() => openDialog('changeRole', member)}>
                                {t('changeRole')}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                            </>
                          )}
                          {isOwner && member.role !== 'owner' && (
                            <DropdownMenuItem
                              onClick={() => openDialog('remove', member)}
                              className='text-destructive'
                            >
                              {t('removeMember')}
                            </DropdownMenuItem>
                          )}
                          {isOwner && member.role === 'owner' && members.length > 1 && (
                            <DropdownMenuItem onClick={() => openDialog('transfer', member)}>
                              {t('transferOwnership')}
                            </DropdownMenuItem>
                          )}
                          {isOwner === false &&
                            session?.user &&
                            member.userId === session.user.id && (
                              <DropdownMenuItem
                                onClick={() => openDialog('remove', member)}
                                className='text-destructive'
                              >
                                {t('leaveWorkspace')}
                              </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialogs */}
      <RemoveMemberDialog
        open={dialogState.type === 'remove' && dialogState.open}
        onOpenChange={open => !open && closeDialog()}
        member={selectedMember}
        workspaceId={activeWorkspace.id}
      />

      <TransferOwnershipDialog
        open={dialogState.type === 'transfer' && dialogState.open}
        onOpenChange={open => !open && closeDialog()}
        members={members.filter(m => m.role !== 'owner')}
        workspaceId={activeWorkspace.id}
      />

      <InviteMemberDialog
        open={dialogState.type === 'invite' && dialogState.open}
        onOpenChange={open => !open && closeDialog()}
        workspaceId={activeWorkspace.id}
      />

      <ChangeRoleDialog
        open={dialogState.type === 'changeRole' && dialogState.open}
        onOpenChange={open => !open && closeDialog()}
        member={selectedMember}
        workspaceId={activeWorkspace.id}
      />
    </div>
  )
}
