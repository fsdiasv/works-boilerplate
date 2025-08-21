import { timingSafeEqual } from 'crypto'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { env } from '@/lib/env'
import { createServiceClient } from '@/lib/supabase/server'

// This endpoint should only be called from trusted sources:
// - Database triggers
// - Supabase Edge Functions
// - Internal services with proper authentication

const requestSchema = z.object({
  userId: z.string().uuid(),
  secret: z.string(),
})

export async function POST(request: NextRequest) {
  try {
    // Validate request body
    const body = (await request.json()) as unknown
    const { userId, secret } = requestSchema.parse(body)

    // Verify the secret to ensure this is an authorized request
    // Use constant-time comparison to prevent timing attacks
    const secretBuffer = Buffer.from(secret, 'utf8')
    const envSecretBuffer = Buffer.from(env.INTERNAL_API_SECRET, 'utf8')

    // Ensure buffers are the same length for timingSafeEqual
    // If lengths differ, create dummy buffers to prevent length-based timing attacks
    let isValidSecret = false
    if (secretBuffer.length === envSecretBuffer.length) {
      isValidSecret = timingSafeEqual(secretBuffer, envSecretBuffer)
    } else {
      // Perform a dummy comparison with same-length buffers to maintain timing consistency
      const dummySecret = Buffer.alloc(envSecretBuffer.length, 'x')
      const dummyEnv = Buffer.alloc(envSecretBuffer.length, 'y')
      timingSafeEqual(dummySecret, dummyEnv) // Always returns false, maintains timing
      isValidSecret = false
    }

    if (!isValidSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Create service client with admin privileges
    const supabase = await createServiceClient()

    // Delete the user from Supabase Auth
    const { error } = await supabase.auth.admin.deleteUser(userId)

    if (error) {
      // Only log in development to avoid exposing sensitive information in production
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.error('Failed to delete user from Supabase Auth:', error)
      }
      return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
    }

    // Log the successful deletion for audit purposes (development only)
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log(`User ${userId} successfully deleted from Supabase Auth`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    // Only log in development to avoid exposing sensitive information in production
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('Error in delete-auth-user endpoint:', error)
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
