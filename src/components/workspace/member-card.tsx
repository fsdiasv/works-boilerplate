'use client'

import { type WorkspaceRole } from '@prisma/client'
import { formatDistanceToNow } from 'date-fns'
import { MoreHorizontal } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { getInitials } from '@/lib/utils/get-initials'

interface MemberCardProps {
  member: {
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
  }
  isOwner: boolean
  isAdmin: boolean
  currentUserId: string | undefined
  onChangeRole: () => void
  onRemove: () => void
  onTransferOwnership: () => void
  canTransferOwnership: boolean
}

export function MemberCard({
  member,
  isOwner,
  isAdmin,
  currentUserId,
  onChangeRole,
  onRemove,
  onTransferOwnership,
  canTransferOwnership,
}: MemberCardProps) {
  const t = useTranslations('workspace.settings.members')

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

  const isCurrentUser = currentUserId === member.userId

  return (
    <Card className='overflow-hidden'>
      <CardContent className='p-4'>
        <div className='flex items-start justify-between gap-3'>
          <div className='flex min-w-0 flex-1 items-start gap-3'>
            <Avatar className='h-12 w-12 flex-shrink-0'>
              <AvatarImage src={member.user.avatarUrl ?? undefined} />
              <AvatarFallback>
                {getInitials(member.user.fullName, member.user.email)}
              </AvatarFallback>
            </Avatar>
            <div className='min-w-0 flex-1'>
              <div className='truncate font-medium'>
                {member.user.fullName ?? member.user.email}
              </div>
              {member.user.fullName !== null && member.user.fullName !== '' && (
                <div className='text-muted-foreground truncate text-sm'>{member.user.email}</div>
              )}
              <div className='mt-2 flex flex-wrap items-center gap-2'>
                <Badge variant={getRoleBadgeVariant(member.role)}>{t(member.role)}</Badge>
                <span className='text-muted-foreground text-xs'>
                  {t('joined')}{' '}
                  {formatDistanceToNow(new Date(member.joinedAt), { addSuffix: true })}
                </span>
              </div>
            </div>
          </div>

          {isAdmin && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant='ghost'
                  size='icon'
                  className={cn(
                    'h-10 w-10 flex-shrink-0',
                    'min-h-[44px] min-w-[44px]' // Ensure touch target compliance
                  )}
                >
                  <MoreHorizontal className='h-5 w-5' />
                  <span className='sr-only'>{t('openMenu')}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end' className='w-56'>
                {isOwner && member.role !== 'owner' && (
                  <>
                    <DropdownMenuItem
                      onClick={onChangeRole}
                      className='flex min-h-[44px] items-center'
                    >
                      {t('changeRole')}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                {isOwner && member.role !== 'owner' && (
                  <DropdownMenuItem
                    onClick={onRemove}
                    className='text-destructive flex min-h-[44px] items-center'
                  >
                    {t('removeMember')}
                  </DropdownMenuItem>
                )}
                {isOwner && member.role === 'owner' && canTransferOwnership && (
                  <DropdownMenuItem
                    onClick={onTransferOwnership}
                    className='flex min-h-[44px] items-center'
                  >
                    {t('transferOwnership')}
                  </DropdownMenuItem>
                )}
                {!isOwner && isCurrentUser && (
                  <DropdownMenuItem
                    onClick={onRemove}
                    className='text-destructive flex min-h-[44px] items-center'
                  >
                    {t('leaveWorkspace')}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
