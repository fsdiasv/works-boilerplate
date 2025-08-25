/* eslint-disable */
import type { User } from '@supabase/supabase-js'

export const testUsers = {
  defaultUser: {
    id: 'test-user-id',
    aud: 'authenticated',
    role: 'authenticated',
    email: 'test@example.com',
    email_confirmed_at: '2024-01-01T00:00:00.000Z',
    phone: null as any,
    phone_confirmed_at: null as any,
    confirmed_at: '2024-01-01T00:00:00.000Z',
    last_sign_in_at: '2024-01-01T00:00:00.000Z',
    app_metadata: {
      provider: 'email',
      providers: ['email'],
    },
    user_metadata: {
      full_name: 'Test User',
      avatar_url: null,
    },
    identities: [],
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
    is_anonymous: false,
  } as User,

  adminUser: {
    id: 'admin-user-id',
    aud: 'authenticated',
    role: 'authenticated',
    email: 'admin@example.com',
    email_confirmed_at: '2024-01-01T00:00:00.000Z',
    phone: null as any,
    phone_confirmed_at: null as any,
    confirmed_at: '2024-01-01T00:00:00.000Z',
    last_sign_in_at: '2024-01-01T00:00:00.000Z',
    app_metadata: {
      provider: 'email',
      providers: ['email'],
    },
    user_metadata: {
      full_name: 'Admin User',
      avatar_url: null,
      role: 'admin',
    },
    identities: [],
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
    is_anonymous: false,
  } as User,

  unverifiedUser: {
    id: 'unverified-user-id',
    aud: 'authenticated',
    role: 'authenticated',
    email: 'unverified@example.com',
    email_confirmed_at: null as any,
    phone: null as any,
    phone_confirmed_at: null as any,
    confirmed_at: null as any,
    last_sign_in_at: null as any,
    app_metadata: {
      provider: 'email',
      providers: ['email'],
    },
    user_metadata: {
      full_name: 'Unverified User',
      avatar_url: null,
    },
    identities: [],
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
    is_anonymous: false,
  } as User,

  oauthUser: {
    id: 'oauth-user-id',
    aud: 'authenticated',
    role: 'authenticated',
    email: 'oauth@example.com',
    email_confirmed_at: '2024-01-01T00:00:00.000Z',
    phone: null as any,
    phone_confirmed_at: null as any,
    confirmed_at: '2024-01-01T00:00:00.000Z',
    last_sign_in_at: '2024-01-01T00:00:00.000Z',
    app_metadata: {
      provider: 'google',
      providers: ['google'],
    },
    user_metadata: {
      full_name: 'OAuth User',
      avatar_url: 'https://example.com/avatar.jpg',
      provider_id: 'google-123',
    },
    identities: [
      {
        id: 'google-123',
        identity_id: 'google-123',
        user_id: 'oauth-user-id',
        provider: 'google',
        identity_data: {
          email: 'oauth@example.com',
          name: 'OAuth User',
          picture: 'https://example.com/avatar.jpg',
        },
        last_sign_in_at: '2024-01-01T00:00:00.000Z',
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
      },
    ],
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
    is_anonymous: false,
  } as User,
}

export const testCredentials = {
  valid: {
    email: 'test@example.com',
    password: 'correct-password',
  },
  invalid: {
    email: 'wrong@example.com',
    password: 'wrong-password',
  },
  weakPassword: {
    email: 'test@example.com',
    password: '123',
  },
  invalidEmail: {
    email: 'invalid-email',
    password: 'validpassword123',
  },
}
