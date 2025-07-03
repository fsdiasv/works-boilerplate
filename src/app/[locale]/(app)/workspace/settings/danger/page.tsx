'use client'

import { AlertTriangle, Archive, Download, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DeleteWorkspaceDialog } from '@/components/workspace/delete-workspace-dialog'
import { useWorkspace, useIsWorkspaceOwner } from '@/contexts/workspace-context'
import { api } from '@/trpc/react'

export default function WorkspaceDangerPage() {
  const t = useTranslations('workspace.settings.danger')
  const { activeWorkspace } = useWorkspace()
  const isOwner = useIsWorkspaceOwner()
  const router = useRouter()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const exportData = api.workspace.exportData.useMutation({
    onSuccess: () => {
      toast.success(t('exportSuccess'))
    },
    onError: error => {
      toast.error(error.message)
    },
  })

  const archiveWorkspace = api.workspace.archive.useMutation({
    onSuccess: () => {
      toast.success(t('archiveSuccess'))
      router.push('/dashboard')
    },
    onError: error => {
      toast.error(error.message)
    },
  })

  const handleExport = () => {
    if (!activeWorkspace) return
    exportData.mutate({ workspaceId: activeWorkspace.id })
  }

  const handleArchive = () => {
    if (!activeWorkspace || !isOwner) return
    archiveWorkspace.mutate({ workspaceId: activeWorkspace.id })
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

      {/* Export Data */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Download className='h-5 w-5' />
            {t('exportData')}
          </CardTitle>
          <CardDescription>{t('exportDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant='outline' onClick={handleExport} disabled={exportData.isPending}>
            {exportData.isPending ? t('exporting') : t('exportButton')}
          </Button>
        </CardContent>
      </Card>

      {/* Only show destructive actions to workspace owner */}
      {isOwner && (
        <>
          {/* Archive Workspace */}
          <Card className='border-warning'>
            <CardHeader>
              <CardTitle className='text-warning flex items-center gap-2'>
                <Archive className='h-5 w-5' />
                {t('archiveWorkspace')}
              </CardTitle>
              <CardDescription>{t('archiveDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant='outline'
                onClick={handleArchive}
                disabled={archiveWorkspace.isPending}
                className='border-warning text-warning hover:bg-warning/10'
              >
                {archiveWorkspace.isPending ? t('archiving') : t('archiveButton')}
              </Button>
            </CardContent>
          </Card>

          {/* Delete Workspace */}
          <Card className='border-destructive'>
            <CardHeader>
              <CardTitle className='text-destructive flex items-center gap-2'>
                <Trash2 className='h-5 w-5' />
                {t('deleteWorkspace')}
              </CardTitle>
              <CardDescription>{t('deleteDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant='destructive' onClick={() => setDeleteDialogOpen(true)}>
                {t('deleteButton')}
              </Button>
            </CardContent>
          </Card>
        </>
      )}

      {!isOwner && (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <AlertTriangle className='text-muted-foreground h-5 w-5' />
              Access Restricted
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-muted-foreground text-sm'>
              Only workspace owners can access destructive actions.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Delete Dialog */}
      <DeleteWorkspaceDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        workspace={activeWorkspace}
      />
    </div>
  )
}
