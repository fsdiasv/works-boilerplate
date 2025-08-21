import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { api, TRPCReactProvider } from '@/trpc/react'

// Mock Next.js
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
}))

// Mock environment
vi.mock('@/lib/env', () => ({
  env: {
    NEXT_PUBLIC_NODE_ENV: 'test',
    NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
    SUPABASE_ANON_KEY: 'test-key',
  },
}))

// Test component to verify tRPC client setup
function TestComponent() {
  const { isLoading } = api.auth.getSession.useQuery(undefined, {
    retry: false,
  })

  return (
    <div>
      {isLoading ? (
        <div data-testid="loading">Loading...</div>
      ) : (
        <div data-testid="ready">Ready</div>
      )}
    </div>
  )
}

describe('tRPC Client Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock fetch to prevent actual API calls
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({
        result: { data: null },
      }),
      headers: new Headers(),
    })
  })

  it('should create tRPC client successfully', () => {
    expect(api).toBeDefined()
    expect(api.auth).toBeDefined()
    expect(api.auth.getSession).toBeDefined()
  })

  it('should provide TRPCReactProvider', () => {
    expect(TRPCReactProvider).toBeDefined()
    expect(typeof TRPCReactProvider).toBe('function')
  })

  it('should render component with tRPC provider', async () => {
    render(
      <TRPCReactProvider>
        <TestComponent />
      </TRPCReactProvider>
    )

    // Should initially show loading
    expect(screen.getByTestId('loading')).toBeInTheDocument()

    // Should eventually show ready state
    await waitFor(() => {
      expect(screen.getByTestId('ready')).toBeInTheDocument()
    })
  })

  it('should have auth procedures available', () => {
    expect(api.auth.getSession).toBeDefined()
    expect(typeof api.auth.getSession.useQuery).toBe('function')
  })

  it('should have workspace procedures available', () => {
    expect(api.workspace).toBeDefined()
  })

  it('should have members procedures available', () => {
    expect(api.members).toBeDefined()
  })

  it('should have invitation procedures available', () => {
    expect(api.invitation).toBeDefined()
  })

  it('should handle query client configuration', () => {
    // Test that the provider doesn't throw errors with default configuration
    expect(() => {
      render(
        <TRPCReactProvider>
          <div>Test</div>
        </TRPCReactProvider>
      )
    }).not.toThrow()
  })

  it('should configure client with correct headers', async () => {
    render(
      <TRPCReactProvider>
        <TestComponent />
      </TRPCReactProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('ready')).toBeInTheDocument()
    })

    // Verify fetch was called with correct headers
    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          'x-trpc-source': 'nextjs-react',
        }),
      })
    )
  })
})