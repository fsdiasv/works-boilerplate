'use client'

import { type WorkspaceRole } from '@prisma/client'
import { formatDistanceToNow } from 'date-fns'
import { Search, UserPlus, MoreHorizontal } from 'lucide-react'
import dynamic from 'next/dynamic'
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
import { MemberCard } from '@/components/workspace/member-card'
import { useAuth } from '@/contexts/auth-context'
import {
  useWorkspace,
  useIsWorkspaceOwner,
  useIsWorkspaceAdmin,
} from '@/contexts/workspace-context'
import { getInitials } from '@/lib/utils/get-initials'
import { api } from '@/trpc/react'

// Lazy load heavy dialog components to reduce initial bundle size
const ChangeRoleDialog = dynamic(
  () =>
    import('@/components/workspace/change-role-dialog').then(mod => ({
      default: mod.ChangeRoleDialog,
    })),
  { ssr: false }
)
const InviteMemberDialog = dynamic(
  () =>
    import('@/components/workspace/invite-member-dialog').then(mod => ({
      default: mod.InviteMemberDialog,
    })),
  { ssr: false }
)
const RemoveMemberDialog = dynamic(
  () =>
    import('@/components/workspace/remove-member-dialog').then(mod => ({
      default: mod.RemoveMemberDialog,
    })),
  { ssr: false }
)
const TransferOwnershipDialog = dynamic(
  () =>
    import('@/components/workspace/transfer-ownership-dialog').then(mod => ({
      default: mod.TransferOwnershipDialog,
    })),
  { ssr: false }
)

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
      lastActiveAt: Date | null
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

      <div className='flex flex-col items-stretch justify-between gap-4 sm:flex-row sm:items-center'>
        <div className='relative flex-1 sm:max-w-sm'>
          <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
          <Input
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className='h-11 pl-9'
          />
        </div>
        {isAdmin && (
          <Button onClick={() => openDialog('invite')} className='h-11'>
            <UserPlus className='mr-2 h-4 w-4' />
            <span className='hidden sm:inline'>{t('inviteMember')}</span>
            <span className='sm:hidden'>{t('invite')}</span>
          </Button>
        )}
      </div>

      {/* Mobile: Member Cards */}
      <div className='space-y-3 md:hidden'>
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className='rounded-lg border p-4'>
              <div className='flex items-center gap-3'>
                <Skeleton className='h-12 w-12 rounded-full' />
                <div className='flex-1 space-y-2'>
                  <Skeleton className='h-4 w-32' />
                  <Skeleton className='h-3 w-24' />
                  <Skeleton className='h-5 w-16' />
                </div>
              </div>
            </div>
          ))
        ) : filteredMembers.length === 0 ? (
          <div className='text-muted-foreground py-8 text-center'>
            {searchQuery ? t('noMembersFound') : t('noMembersYet')}
          </div>
        ) : (
          filteredMembers.map(member => (
            <MemberCard
              key={`${member.userId}-${member.workspaceId}`}
              member={member}
              isOwner={isOwner}
              isAdmin={isAdmin}
              currentUserId={session?.user.id}
              onChangeRole={() => openDialog('changeRole', member)}
              onRemove={() => openDialog('remove', member)}
              onTransferOwnership={() => openDialog('transfer', member)}
              canTransferOwnership={members.length > 1}
            />
          ))
        )}
      </div>

      {/* Desktop: Table */}
      <div className='hidden rounded-md border md:block'>
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
                  {searchQuery ? t('noMembersFound') : t('noMembersYet')}
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
                          <Button
                            variant='ghost'
                            size='icon'
                            className='h-10 min-h-[44px] w-10 min-w-[44px]'
                          >
                            <MoreHorizontal className='h-4 w-4' />
                            <span className='sr-only'>{t('openMenu')}</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end'>
                          {isOwner && member.role !== 'owner' && (
                            <>
                              <DropdownMenuItem
                                onClick={() => openDialog('changeRole', member)}
                                className='flex min-h-[44px] items-center'
                              >
                                {t('changeRole')}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                            </>
                          )}
                          {isOwner && member.role !== 'owner' && (
                            <DropdownMenuItem
                              onClick={() => openDialog('remove', member)}
                              className='text-destructive flex min-h-[44px] items-center'
                            >
                              {t('removeMember')}
                            </DropdownMenuItem>
                          )}
                          {isOwner && member.role === 'owner' && members.length > 1 && (
                            <DropdownMenuItem
                              onClick={() => openDialog('transfer', member)}
                              className='flex min-h-[44px] items-center'
                            >
                              {t('transferOwnership')}
                            </DropdownMenuItem>
                          )}
                          {isOwner === false &&
                            session?.user &&
                            member.userId === session.user.id && (
                              <DropdownMenuItem
                                onClick={() => openDialog('remove', member)}
                                className='text-destructive flex min-h-[44px] items-center'
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
        isLeavingWorkspace={
          selectedMember !== null &&
          session !== null &&
          selectedMember.user.id === session.user.id &&
          selectedMember.role !== 'owner'
        }
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
