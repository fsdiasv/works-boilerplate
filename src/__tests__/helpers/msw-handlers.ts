import { http, HttpResponse } from 'msw'

// Auth handlers for Supabase auth API
export const authHandlers = [
  // Sign in with email/password
  http.post('*/auth/v1/token', async ({ request }) => {
    const body = await request.json() as any
    
    if (body.email === 'test@example.com' && body.password === 'correct-password') {
      return HttpResponse.json({
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        expires_in: 3600,
        token_type: 'bearer',
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          email_confirmed_at: new Date().toISOString(),
          user_metadata: { full_name: 'Test User' },
          app_metadata: { provider: 'email' }
        }
      })
    }
    
    return HttpResponse.json(
      { error: 'Invalid login credentials' },
      { status: 400 }
    )
  }),

  // Sign up
  http.post('*/auth/v1/signup', async ({ request }) => {
    const body = await request.json() as any
    
    if (body.email && body.password) {
      return HttpResponse.json({
        user: {
          id: 'new-user-id',
          email: body.email,
          email_confirmed_at: null,
          user_metadata: body.data || {},
          app_metadata: { provider: 'email' }
        },
        session: null // Email confirmation required
      })
    }
    
    return HttpResponse.json(
      { error: 'Signup failed' },
      { status: 400 }
    )
  }),

  // Sign out
  http.post('*/auth/v1/logout', () => {
    return HttpResponse.json({})
  }),

  // Password reset
  http.post('*/auth/v1/recover', async ({ request }) => {
    const body = await request.json() as any
    
    if (body.email) {
      return HttpResponse.json({})
    }
    
    return HttpResponse.json(
      { error: 'Email is required' },
      { status: 400 }
    )
  }),

  // OAuth
  http.post('*/auth/v1/authorize', async ({ request }) => {
    const url = new URL(request.url)
    const provider = url.searchParams.get('provider')
    
    if (provider && ['google', 'github', 'apple'].includes(provider)) {
      return HttpResponse.json({
        url: `https://example.com/oauth/${provider}?state=mock-state`
      })
    }
    
    return HttpResponse.json(
      { error: 'Invalid provider' },
      { status: 400 }
    )
  }),

  // Get user session
  http.get('*/auth/v1/user', ({ request }) => {
    const authHeader = request.headers.get('Authorization')
    
    if (authHeader?.includes('mock-access-token')) {
      return HttpResponse.json({
        id: 'test-user-id',
        email: 'test@example.com',
        email_confirmed_at: new Date().toISOString(),
        user_metadata: { full_name: 'Test User' },
        app_metadata: { provider: 'email' }
      })
    }
    
    return HttpResponse.json(
      { error: 'Invalid token' },
      { status: 401 }
    )
  })
]

// tRPC handlers
export const trpcHandlers = [
  // Auth router
  http.post('*/api/trpc/auth.getSession*', ({ request }) => {
    const authHeader = request.headers.get('Authorization')
    
    if (authHeader?.includes('mock-access-token')) {
      return HttpResponse.json({
        result: {
          data: {
            user: {
              id: 'test-user-id',
              email: 'test@example.com',
              full_name: 'Test User'
            },
            workspace: {
              id: 'test-workspace-id',
              name: 'Test Workspace',
              slug: 'test-workspace'
            }
          }
        }
      })
    }
    
    return HttpResponse.json({
      result: { data: null }
    })
  }),

  http.post('*/api/trpc/auth.signUp*', async ({ request }) => {
    const body = await request.json() as any
    const input = body.json || body
    
    if (input.email && input.password && input.fullName) {
      return HttpResponse.json({
        result: {
          data: {
            success: true,
            message: 'Please check your email to verify your account'
          }
        }
      })
    }
    
    return HttpResponse.json(
      {
        error: {
          message: 'Validation failed',
          code: 'BAD_REQUEST'
        }
      },
      { status: 400 }
    )
  }),

  // Workspace router
  http.post('*/api/trpc/workspace.list*', ({ request }) => {
    const authHeader = request.headers.get('Authorization')
    
    if (authHeader?.includes('mock-access-token')) {
      return HttpResponse.json({
        result: {
          data: [
            {
              id: 'test-workspace-id',
              name: 'Test Workspace',
              slug: 'test-workspace',
              role: 'OWNER'
            }
          ]
        }
      })
    }
    
    return HttpResponse.json(
      {
        error: {
          message: 'Unauthorized',
          code: 'UNAUTHORIZED'
        }
      },
      { status: 401 }
    )
  })
]

// Database handlers (for integration tests)
export const databaseHandlers = [
  // Mock Prisma operations
  http.post('*/graphql', async ({ request }) => {
    const body = await request.json() as any
    const operation = body.query
    
    // Mock user queries
    if (operation.includes('findUnique') && operation.includes('User')) {
      return HttpResponse.json({
        data: {
          findUniqueUser: {
            id: 'test-user-id',
            email: 'test@example.com',
            full_name: 'Test User'
          }
        }
      })
    }
    
    // Mock workspace queries
    if (operation.includes('findMany') && operation.includes('Workspace')) {
      return HttpResponse.json({
        data: {
          findManyWorkspace: [
            {
              id: 'test-workspace-id',
              name: 'Test Workspace',
              slug: 'test-workspace'
            }
          ]
        }
      })
    }
    
    return HttpResponse.json({
      data: null
    })
  })
]

// Rate limiting handlers
export const rateLimitHandlers = [
  http.all('*/api/*', ({ request }) => {
    const rateLimitHeader = request.headers.get('X-Test-Rate-Limit')
    
    if (rateLimitHeader === 'exceeded') {
      return HttpResponse.json(
        { error: 'Rate limit exceeded' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': '10',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': '1640995200'
          }
        }
      )
    }
    
    // Default to passing through
    return
  })
]

// Combine all handlers
export const handlers = [
  ...authHandlers,
  ...trpcHandlers,
  ...databaseHandlers,
  ...rateLimitHandlers
]