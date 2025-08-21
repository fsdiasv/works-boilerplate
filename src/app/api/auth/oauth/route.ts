import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'

import { generateOAuthState, setOAuthStateCookie } from '@/lib/oauth-state'
import { createClient } from '@/lib/supabase/server'

// Request validation schema
const oauthRequestSchema = z.object({
  provider: z.enum(['google', 'github', 'apple']),
})

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as unknown

    // Validate request with Zod
    const validationResult = oauthRequestSchema.safeParse(body)

    if (!validationResult.success) {
      // Generic error message to avoid exposing validation details
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const { provider } = validationResult.data

    // Generate secure state parameter
    const state = generateOAuthState()

    // Store state in secure httpOnly cookie
    await setOAuthStateCookie(state)

    // Create Supabase client
    const supabase = await createClient()

    // Get the origin for redirect URL
    const origin = new URL(request.url).origin

    // Initiate OAuth flow with Supabase
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
          state, // Include state parameter for CSRF protection
        },
      },
    })

    if (error) {
      // Generic error message to avoid exposing internal details
      if (process.env.NODE_ENV === 'development') {
        console.error('OAuth initiation error:', error)
      }
      return NextResponse.json({ error: 'Authentication failed' }, { status: 400 })
    }

    // Return the OAuth URL to redirect to
    return NextResponse.json({
      url: data.url,
      state, // Return state for client verification (optional)
    })
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.error('OAuth route error:', err)
    }
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 })
  }
}
