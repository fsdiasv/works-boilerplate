'use client'

import { Upload } from 'lucide-react'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { api } from '@/trpc/react'

interface BulkInviteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceId: string
}

export function BulkInviteDialog({ open, onOpenChange, workspaceId }: BulkInviteDialogProps) {
  const t = useTranslations('workspace.settings.invitations')
  const tMembers = useTranslations('workspace.settings.members')
  const [emails, setEmails] = useState('')
  const [role, setRole] = useState<'admin' | 'member'>('member')
  const [isProcessing, setIsProcessing] = useState(false)
  const utils = api.useUtils()

  const inviteMembers = api.invitation.createBulk.useMutation({
    onSuccess: data => {
      const successCount = data.filter(r => r.success).length
      const failCount = data.filter(r => !r.success).length

      if (successCount > 0) {
        toast.success(`${successCount} invitations sent successfully`)
      }
      if (failCount > 0) {
        toast.error(`${failCount} invitations failed`)
      }

      void utils.invitation.list.invalidate()
      setEmails('')
      onOpenChange(false)
    },
    onError: error => {
      toast.error(error.message)
    },
  })

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file')
      return
    }

    setIsProcessing(true)
    try {
      const text = await file.text()
      const lines = text.split('\n').filter(line => line.trim())
      const emailList = lines
        .map(line => line.split(',')[0]?.trim())
        .filter((email): email is string => email?.includes('@') === true)

      setEmails(emailList.join('\n'))
    } catch {
      toast.error('Failed to read file')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSubmit = () => {
    const emailList = emails
      .split(/[\n,]/)
      .map(email => email.trim())
      .filter((email): email is string => email.includes('@'))

    if (emailList.length === 0) {
      toast.error('Please enter at least one valid email')
      return
    }

    inviteMembers.mutate({
      workspaceId,
      invitations: emailList.map(email => ({ email, role })),
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <DialogTitle>{t('bulkTitle')}</DialogTitle>
          <DialogDescription>{t('bulkDescription')}</DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='csv-upload'>Upload CSV</Label>
            <div className='flex items-center gap-2'>
              <Input
                id='csv-upload'
                type='file'
                accept='.csv'
                onChange={e => void handleFileUpload(e)}
                disabled={isProcessing}
                className='flex-1'
              />
              <Upload className='text-muted-foreground h-4 w-4' />
            </div>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='emails'>Or paste emails</Label>
            <Textarea
              id='emails'
              placeholder={t('bulkPlaceholder')}
              value={emails}
              onChange={e => setEmails(e.target.value)}
              rows={6}
              className='resize-none'
            />
            <p className='text-muted-foreground text-xs'>One email per line or comma-separated</p>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='bulk-role'>Default role</Label>
            <Select value={role} onValueChange={value => setRole(value as 'admin' | 'member')}>
              <SelectTrigger id='bulk-role'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='admin'>{tMembers('admin')}</SelectItem>
                <SelectItem value='member'>{tMembers('member')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!emails.trim() || inviteMembers.isPending || isProcessing}
          >
            {inviteMembers.isPending ? 'Sending...' : 'Send Invitations'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
