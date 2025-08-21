export const testWorkspaces = {
  defaultWorkspace: {
    id: 'test-workspace-id',
    name: 'Test Workspace',
    slug: 'test-workspace',
    description: 'A test workspace for development',
    logo_url: null,
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z'
  },

  personalWorkspace: {
    id: 'personal-workspace-id',
    name: 'Personal Workspace',
    slug: 'personal-workspace',
    description: 'Personal workspace for individual use',
    logo_url: null,
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z'
  },

  teamWorkspace: {
    id: 'team-workspace-id',
    name: 'Team Workspace',
    slug: 'team-workspace',
    description: 'Collaborative workspace for team projects',
    logo_url: 'https://example.com/team-logo.png',
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z'
  }
}

export const testWorkspaceMembers = {
  owner: {
    id: 'member-owner-id',
    workspace_id: 'test-workspace-id',
    user_id: 'test-user-id',
    role: 'OWNER' as const,
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z'
  },

  admin: {
    id: 'member-admin-id',
    workspace_id: 'test-workspace-id',
    user_id: 'admin-user-id',
    role: 'ADMIN' as const,
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z'
  },

  member: {
    id: 'member-regular-id',
    workspace_id: 'test-workspace-id',
    user_id: 'regular-user-id',
    role: 'MEMBER' as const,
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z'
  }
}

export const testWorkspaceInvitations = {
  pending: {
    id: 'invitation-pending-id',
    workspace_id: 'test-workspace-id',
    email: 'pending@example.com',
    role: 'MEMBER' as const,
    invited_by: 'test-user-id',
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z'
  },

  expired: {
    id: 'invitation-expired-id',
    workspace_id: 'test-workspace-id',
    email: 'expired@example.com',
    role: 'MEMBER' as const,
    invited_by: 'test-user-id',
    expires_at: '2023-12-01T00:00:00.000Z', // Past date
    created_at: '2023-11-01T00:00:00.000Z',
    updated_at: '2023-11-01T00:00:00.000Z'
  }
}