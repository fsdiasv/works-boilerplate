'use client'

import { Loader2, CheckCircle, XCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { api } from '@/trpc/react'

export default function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const [params, setParams] = useState<{ [key: string]: string | string[] | undefined }>({})
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState<string>('')

  const router = useRouter()
  const locale = useLocale()

  const verifyEmailMutation = api.auth.verifyEmail.useMutation({
    onSuccess: () => {
      setStatus('success')
      setTimeout(() => {
        router.push(`/${locale}/dashboard`)
      }, 3000)
    },
    onError: error => {
      setStatus('error')
      setErrorMessage(error.message)
    },
  })

  useEffect(() => {
    void searchParams.then(setParams)
  }, [searchParams])

  useEffect(() => {
    const token = params.token as string | undefined
    const type = params.type as string | undefined

    if (
      token !== undefined &&
      token !== '' &&
      type !== undefined &&
      type !== '' &&
      (type === 'signup' || type === 'email_change')
    ) {
      verifyEmailMutation.mutate({ token, type })
    } else if (params.token !== undefined) {
      // Invalid parameters
      setStatus('error')
      setErrorMessage('Invalid verification link')
    }
  }, [params, verifyEmailMutation])

  return (
    <div className='relative container flex min-h-screen flex-col items-center justify-center px-4 md:px-8'>
      <Card className='w-full max-w-md'>
        <CardHeader className='text-center'>
          <CardTitle className='text-2xl font-bold'>
            {status === 'loading' && 'Verifying Email'}
            {status === 'success' && 'Email Verified!'}
            {status === 'error' && 'Verification Failed'}
          </CardTitle>
          <CardDescription>
            {status === 'loading' && 'Please wait while we verify your email...'}
            {status === 'success' && 'Your email has been successfully verified.'}
            {status === 'error' && 'We could not verify your email address.'}
          </CardDescription>
        </CardHeader>
        <CardContent className='flex flex-col items-center space-y-4'>
          {status === 'loading' && (
            <Loader2 className='text-muted-foreground h-12 w-12 animate-spin' />
          )}
          {status === 'success' && (
            <>
              <CheckCircle className='h-12 w-12 text-green-500' />
              <p className='text-muted-foreground text-center text-sm'>
                Redirecting to dashboard...
              </p>
            </>
          )}
          {status === 'error' && (
            <>
              <XCircle className='text-destructive h-12 w-12' />
              <p className='text-destructive text-center text-sm'>{errorMessage}</p>
              <Button onClick={() => router.push(`/${locale}/login`)} className='w-full'>
                Back to Login
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
