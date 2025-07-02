'use client'

import { type Workspace, type WorkspaceRole } from '@prisma/client'
import { createContext, useContext, type ReactNode } from 'react'

import { api } from '@/trpc/react'

interface WorkspaceContextValue {
  activeWorkspace: Workspace | null | undefined
  userRole: WorkspaceRole | null | undefined
  isLoading: boolean
}

const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(undefined)

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { data: session, isLoading } = api.auth.getSession.useQuery()

  const value: WorkspaceContextValue = {
    activeWorkspace: session?.activeWorkspace ?? null,
    userRole: session?.userRole ?? null,
    isLoading,
  }

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext)
  if (!context) {
    throw new Error('useWorkspace must be used within WorkspaceProvider')
  }
  return context
}

// Helper hooks for common workspace checks
export function useIsWorkspaceAdmin() {
  const { userRole } = useWorkspace()
  return userRole === 'owner' || userRole === 'admin'
}

export function useIsWorkspaceOwner() {
  const { userRole } = useWorkspace()
  return userRole === 'owner'
}

export function useCanManageWorkspace() {
  const { userRole } = useWorkspace()
  return userRole === 'owner' || userRole === 'admin'
}
