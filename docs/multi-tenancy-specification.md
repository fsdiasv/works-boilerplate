# Multi-Tenancy Implementation Specification

## Overview

This document outlines the complete specification for implementing a
workspace-based multi-tenancy system in the Works Boilerplate. The
implementation will provide complete data isolation, role-based access control,
and seamless workspace management.

## Implementation Status: 80% Complete

### ✅ Completed Components

- Database Schema and Models
- SQL Migration with RLS Policies
- tRPC API Layer (all routers)
- Core UI Components (WorkspaceSwitcher)
- Context Providers and Hooks
- Internationalization
- Security Implementation

### ⏳ Pending Components

- Workspace Settings UI Pages
- Onboarding Flow
- Comprehensive Testing
- Final Security Audit

## 1. Database Schema Design

### 1.1 Workspace Model

```prisma
model Workspace {
  id          String   @id @default(uuid())
  name        String
  slug        String   @unique
  logo        String?
  settings    Json     @default("{}")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  deletedAt   DateTime? @map("deleted_at") // Soft delete

  // Relations
  members     WorkspaceMember[]
  invitations Invitation[]
  activeUsers User[] @relation("UserActiveWorkspace")

  @@index([slug])
  @@map("workspaces")
}
```

**Field Specifications:**

- `id`: UUID for security and Supabase compatibility
- `name`: Display name (2-50 characters)
- `slug`: URL-friendly identifier (3-50 characters, lowercase, alphanumeric +
  hyphens)
- `logo`: Optional URL to workspace logo
- `settings`: JSON object for workspace preferences
- `deletedAt`: Soft delete timestamp for data retention

### 1.2 WorkspaceMember Model

```prisma
model WorkspaceMember {
  userId      String   @map("user_id")
  workspaceId String   @map("workspace_id")
  role        WorkspaceRole
  joinedAt    DateTime @default(now()) @map("joined_at")

  // Relations
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  @@id([userId, workspaceId])
  @@index([workspaceId])
  @@index([userId])
  @@map("workspace_members")
}

enum WorkspaceRole {
  owner
  admin
  member
}
```

**Role Permissions:**

- `owner`: Full control (only one per workspace)
- `admin`: Manage members, settings, content
- `member`: View and create content

### 1.3 Invitation Model

```prisma
model Invitation {
  id          String   @id @default(uuid())
  workspaceId String   @map("workspace_id")
  email       String
  role        WorkspaceRole
  invitedById String   @map("invited_by_id")
  token       String   @unique @default(cuid())
  expiresAt   DateTime @map("expires_at")
  acceptedAt  DateTime? @map("accepted_at")
  createdAt   DateTime @default(now()) @map("created_at")

  // Relations
  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  invitedBy   User      @relation(fields: [invitedById], references: [id], onDelete: Cascade)

  @@index([token])
  @@index([email])
  @@index([workspaceId])
  @@map("invitations")
}
```

**Invitation Flow:**

1. Admin/Owner creates invitation with 7-day expiry
2. Email sent with secure token link
3. User accepts invitation (creates account if needed)
4. User added to workspace with specified role

### 1.4 User Model Updates

```prisma
// Add to existing User model:
activeWorkspaceId String?  @map("active_workspace_id")
lastActiveAt     DateTime  @default(now()) @map("last_active_at")

// Relations
workspaceMemberships WorkspaceMember[]
invitationsSent      Invitation[]
activeWorkspace      Workspace? @relation("UserActiveWorkspace", fields: [activeWorkspaceId], references: [id], onDelete: SetNull)
```

## 2. Row Level Security (RLS) Policies

### 2.1 Workspace Access Policy

```sql
-- Enable RLS on workspaces table
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

-- Users can only see workspaces they're members of
CREATE POLICY "workspace_access" ON workspaces
  FOR ALL
  USING (
    id IN (
      SELECT workspace_id
      FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );
```

### 2.2 Workspace Member Policy

```sql
-- Enable RLS on workspace_members table
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;

-- Users can see members of their workspaces
CREATE POLICY "member_access" ON workspace_members
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id
      FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- Only admins/owners can manage members
CREATE POLICY "member_management" ON workspace_members
  FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id
      FROM workspace_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );
```

### 2.3 Data Isolation Template

For any table that needs workspace isolation:

```sql
-- Add workspace_id column
ALTER TABLE [table_name] ADD COLUMN workspace_id UUID NOT NULL;

-- Add foreign key constraint
ALTER TABLE [table_name]
  ADD CONSTRAINT fk_workspace
  FOREIGN KEY (workspace_id)
  REFERENCES workspaces(id)
  ON DELETE CASCADE;

-- Enable RLS
ALTER TABLE [table_name] ENABLE ROW LEVEL SECURITY;

-- Create isolation policy
CREATE POLICY "workspace_isolation" ON [table_name]
  FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id
      FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );
```

### 2.4 Helper Functions

```sql
-- Check if user is workspace member
CREATE OR REPLACE FUNCTION is_workspace_member(workspace_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM workspace_members
    WHERE workspace_members.workspace_id = $1
    AND workspace_members.user_id = $2
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user role in workspace
CREATE OR REPLACE FUNCTION get_user_role(workspace_id UUID, user_id UUID)
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT role::TEXT
    FROM workspace_members
    WHERE workspace_members.workspace_id = $1
    AND workspace_members.user_id = $2
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## 3. API Design (tRPC)

### 3.1 Enhanced Context

```typescript
interface TRPCContext {
  user: User | null
  supabase: SupabaseClient
  db: PrismaClient
  locale: string
  // New additions:
  activeWorkspace: Workspace | null
  userRole: WorkspaceRole | null
}
```

### 3.2 Workspace Router

```typescript
// src/server/api/routers/workspace.ts

export const workspaceRouter = createTRPCRouter({
  // Get current user's workspaces
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.workspace.findMany({
      where: {
        members: {
          some: { userId: ctx.user.id },
        },
      },
      include: {
        members: {
          where: { userId: ctx.user.id },
          select: { role: true },
        },
      },
    })
  }),

  // Create new workspace
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(2).max(50),
        slug: z
          .string()
          .min(3)
          .max(50)
          .regex(/^[a-z0-9-]+$/),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Create workspace and add user as owner
      const workspace = await ctx.db.workspace.create({
        data: {
          name: input.name,
          slug: input.slug,
          members: {
            create: {
              userId: ctx.user.id,
              role: 'owner',
            },
          },
        },
      })

      // Set as active workspace
      await ctx.db.user.update({
        where: { id: ctx.user.id },
        data: { activeWorkspaceId: workspace.id },
      })

      return workspace
    }),

  // Update workspace settings
  update: workspaceAdminProcedure
    .input(
      z.object({
        workspaceId: z.string().uuid(),
        name: z.string().min(2).max(50).optional(),
        logo: z.string().url().optional(),
        settings: z.record(z.any()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { workspaceId, ...data } = input
      return ctx.db.workspace.update({
        where: { id: workspaceId },
        data,
      })
    }),

  // Delete workspace (owner only)
  delete: workspaceOwnerProcedure
    .input(
      z.object({
        workspaceId: z.string().uuid(),
        confirmation: z.literal('DELETE'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Soft delete
      return ctx.db.workspace.update({
        where: { id: input.workspaceId },
        data: { deletedAt: new Date() },
      })
    }),

  // Switch active workspace
  switchActive: protectedProcedure
    .input(
      z.object({
        workspaceId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify membership
      const membership = await ctx.db.workspaceMember.findUnique({
        where: {
          userId_workspaceId: {
            userId: ctx.user.id,
            workspaceId: input.workspaceId,
          },
        },
      })

      if (!membership) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Not a member of this workspace',
        })
      }

      // Update active workspace
      return ctx.db.user.update({
        where: { id: ctx.user.id },
        data: {
          activeWorkspaceId: input.workspaceId,
          lastActiveAt: new Date(),
        },
      })
    }),
})
```

### 3.3 Members Router

```typescript
// src/server/api/routers/members.ts

export const membersRouter = createTRPCRouter({
  // List workspace members
  list: workspaceMemberProcedure
    .input(
      z.object({
        workspaceId: z.string().uuid(),
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const members = await ctx.db.workspaceMember.findMany({
        where: { workspaceId: input.workspaceId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
              avatarUrl: true,
            },
          },
        },
        take: input.limit + 1,
        cursor: input.cursor
          ? {
              userId_workspaceId: {
                userId: input.cursor,
                workspaceId: input.workspaceId,
              },
            }
          : undefined,
      })

      let nextCursor: string | undefined = undefined
      if (members.length > input.limit) {
        const nextItem = members.pop()
        nextCursor = nextItem!.userId
      }

      return {
        members,
        nextCursor,
      }
    }),

  // Send invitation
  invite: workspaceAdminProcedure
    .input(
      z.object({
        workspaceId: z.string().uuid(),
        email: z.string().email(),
        role: z.enum(['admin', 'member']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if already member
      const existingUser = await ctx.db.user.findUnique({
        where: { email: input.email },
      })

      if (existingUser) {
        const existingMember = await ctx.db.workspaceMember.findUnique({
          where: {
            userId_workspaceId: {
              userId: existingUser.id,
              workspaceId: input.workspaceId,
            },
          },
        })

        if (existingMember) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'User is already a member',
          })
        }
      }

      // Create invitation
      const invitation = await ctx.db.invitation.create({
        data: {
          workspaceId: input.workspaceId,
          email: input.email,
          role: input.role,
          invitedById: ctx.user.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      })

      // Send invitation email
      await sendInvitationEmail({
        to: input.email,
        inviterName: ctx.user.fullName || ctx.user.email,
        workspaceName: ctx.activeWorkspace!.name,
        invitationToken: invitation.token,
      })

      return invitation
    }),

  // Remove member
  remove: workspaceAdminProcedure
    .input(
      z.object({
        workspaceId: z.string().uuid(),
        userId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Can't remove owner
      const member = await ctx.db.workspaceMember.findUnique({
        where: {
          userId_workspaceId: {
            userId: input.userId,
            workspaceId: input.workspaceId,
          },
        },
      })

      if (member?.role === 'owner') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Cannot remove workspace owner',
        })
      }

      // Remove member
      return ctx.db.workspaceMember.delete({
        where: {
          userId_workspaceId: {
            userId: input.userId,
            workspaceId: input.workspaceId,
          },
        },
      })
    }),

  // Update member role
  updateRole: workspaceOwnerProcedure
    .input(
      z.object({
        workspaceId: z.string().uuid(),
        userId: z.string().uuid(),
        role: z.enum(['admin', 'member']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.workspaceMember.update({
        where: {
          userId_workspaceId: {
            userId: input.userId,
            workspaceId: input.workspaceId,
          },
        },
        data: { role: input.role },
      })
    }),
})
```

### 3.4 Invitation Router

```typescript
// src/server/api/routers/invitation.ts

export const invitationRouter = createTRPCRouter({
  // Accept invitation
  accept: publicProcedure
    .input(
      z.object({
        token: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Find valid invitation
      const invitation = await ctx.db.invitation.findFirst({
        where: {
          token: input.token,
          acceptedAt: null,
          expiresAt: { gt: new Date() },
        },
        include: { workspace: true },
      })

      if (!invitation) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Invalid or expired invitation',
        })
      }

      // Get or create user
      let user = ctx.user
      if (!user) {
        user = await ctx.db.user.findUnique({
          where: { email: invitation.email },
        })

        if (!user) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Please sign up first',
          })
        }
      }

      // Add to workspace
      await ctx.db.workspaceMember.create({
        data: {
          userId: user.id,
          workspaceId: invitation.workspaceId,
          role: invitation.role,
        },
      })

      // Mark invitation as accepted
      await ctx.db.invitation.update({
        where: { id: invitation.id },
        data: { acceptedAt: new Date() },
      })

      // Set as active workspace if user has none
      if (!user.activeWorkspaceId) {
        await ctx.db.user.update({
          where: { id: user.id },
          data: { activeWorkspaceId: invitation.workspaceId },
        })
      }

      return { workspace: invitation.workspace }
    }),

  // Get invitation details
  get: publicProcedure
    .input(
      z.object({
        token: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const invitation = await ctx.db.invitation.findFirst({
        where: {
          token: input.token,
          acceptedAt: null,
          expiresAt: { gt: new Date() },
        },
        include: {
          workspace: {
            select: {
              name: true,
              logo: true,
            },
          },
          invitedBy: {
            select: {
              fullName: true,
              email: true,
            },
          },
        },
      })

      if (!invitation) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Invalid or expired invitation',
        })
      }

      return invitation
    }),
})
```

### 3.5 Middleware Definitions

```typescript
// Workspace member middleware
export const workspaceMemberProcedure = protectedProcedure.use(
  async ({ ctx, next }) => {
    if (!ctx.activeWorkspace) {
      throw new TRPCError({
        code: 'PRECONDITION_FAILED',
        message: 'No active workspace',
      })
    }

    return next({
      ctx: {
        ...ctx,
        activeWorkspace: ctx.activeWorkspace,
        userRole: ctx.userRole!,
      },
    })
  }
)

// Workspace admin middleware
export const workspaceAdminProcedure = workspaceMemberProcedure.use(
  async ({ ctx, next }) => {
    if (!['owner', 'admin'].includes(ctx.userRole)) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Admin access required',
      })
    }

    return next({ ctx })
  }
)

// Workspace owner middleware
export const workspaceOwnerProcedure = workspaceMemberProcedure.use(
  async ({ ctx, next }) => {
    if (ctx.userRole !== 'owner') {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Owner access required',
      })
    }

    return next({ ctx })
  }
)
```

## 4. UI Components

### 4.1 WorkspaceSwitcher Component

```typescript
// src/components/workspace/WorkspaceSwitcher.tsx

interface WorkspaceSwitcherProps {
  className?: string;
}

export function WorkspaceSwitcher({ className }: WorkspaceSwitcherProps) {
  const { data: workspaces } = api.workspace.list.useQuery();
  const { activeWorkspace } = useWorkspace();
  const switchWorkspace = api.workspace.switchActive.useMutation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={cn("flex items-center gap-2", className)}>
        <Avatar className="h-8 w-8">
          <AvatarImage src={activeWorkspace?.logo} />
          <AvatarFallback>
            {activeWorkspace?.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <span className="font-medium">{activeWorkspace?.name}</span>
        <ChevronDown className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {workspaces?.map((workspace) => (
          <DropdownMenuItem
            key={workspace.id}
            onClick={() => switchWorkspace.mutate({ workspaceId: workspace.id })}
          >
            <Avatar className="h-6 w-6 mr-2">
              <AvatarImage src={workspace.logo} />
              <AvatarFallback>
                {workspace.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="font-medium">{workspace.name}</div>
              <div className="text-xs text-muted-foreground">
                {workspace.members[0].role}
              </div>
            </div>
            {activeWorkspace?.id === workspace.id && (
              <Check className="h-4 w-4" />
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/workspace/new">
            <Plus className="h-4 w-4 mr-2" />
            Create workspace
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

### 4.2 Members Management Table

```typescript
// src/components/workspace/MembersTable.tsx

export function MembersTable({ workspaceId }: { workspaceId: string }) {
  const { data, fetchNextPage, hasNextPage } = api.members.list.useInfiniteQuery(
    { workspaceId },
    { getNextPageParam: (lastPage) => lastPage.nextCursor }
  );

  const removeMember = api.members.remove.useMutation();
  const updateRole = api.members.updateRole.useMutation();

  const members = data?.pages.flatMap((page) => page.members) ?? [];

  return (
    <div className="space-y-4">
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => (
              <TableRow key={member.userId}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={member.user.avatarUrl} />
                      <AvatarFallback>
                        {member.user.fullName?.charAt(0) || member.user.email.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{member.user.fullName || member.user.email}</div>
                      <div className="text-sm text-muted-foreground">{member.user.email}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Select
                    value={member.role}
                    onValueChange={(role) => updateRole.mutate({
                      workspaceId,
                      userId: member.userId,
                      role: role as 'admin' | 'member'
                    })}
                    disabled={member.role === 'owner'}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="owner" disabled>Owner</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="member">Member</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-right">
                  {member.role !== 'owner' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMember.mutate({
                        workspaceId,
                        userId: member.userId
                      })}
                    >
                      Remove
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {hasNextPage && (
        <Button
          variant="outline"
          onClick={() => fetchNextPage()}
          className="w-full"
        >
          Load more
        </Button>
      )}
    </div>
  );
}
```

### 4.3 Invitation Component

```typescript
// src/components/workspace/InviteMemberDialog.tsx

export function InviteMemberDialog({ workspaceId }: { workspaceId: string }) {
  const [open, setOpen] = useState(false);
  const invite = api.members.invite.useMutation({
    onSuccess: () => {
      setOpen(false);
      toast.success('Invitation sent!');
    }
  });

  const form = useForm({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: '',
      role: 'member' as const,
    }
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          Invite member
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite team member</DialogTitle>
          <DialogDescription>
            Send an invitation to join this workspace
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) =>
            invite.mutate({ workspaceId, ...data })
          )}>
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email address</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" placeholder="colleague@company.com" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="member">Member</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={invite.isPending}>
                {invite.isPending ? 'Sending...' : 'Send invitation'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
```

### 4.4 Workspace Context Provider

```typescript
// src/contexts/workspace-context.tsx

interface WorkspaceContextValue {
  activeWorkspace: Workspace | null;
  userRole: WorkspaceRole | null;
  isLoading: boolean;
  switchWorkspace: (workspaceId: string) => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const utils = api.useUtils();

  const { data: session, isLoading } = api.auth.getSession.useQuery(
    undefined,
    { enabled: !!user }
  );

  const switchWorkspaceMutation = api.workspace.switchActive.useMutation({
    onSuccess: () => {
      utils.auth.getSession.invalidate();
      utils.workspace.list.invalidate();
    }
  });

  const activeWorkspace = session?.activeWorkspace ?? null;
  const userRole = session?.userRole ?? null;

  const switchWorkspace = async (workspaceId: string) => {
    await switchWorkspaceMutation.mutateAsync({ workspaceId });
  };

  return (
    <WorkspaceContext.Provider value={{
      activeWorkspace,
      userRole,
      isLoading,
      switchWorkspace,
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within WorkspaceProvider');
  }
  return context;
}
```

## 5. User Flows

### 5.1 New User Onboarding

```
1. User signs up
2. Redirect to /onboarding/workspace
3. Form: Create your first workspace
   - Name (required)
   - Slug (auto-generated from name)
4. Create workspace (user becomes owner)
5. Optional: Invite team members
6. Redirect to /dashboard
```

### 5.2 Workspace Switching

```
1. Click workspace switcher in header
2. Dropdown shows all workspaces
3. Click different workspace
4. Update activeWorkspaceId
5. Reload current page with new context
6. All data now scoped to new workspace
```

### 5.3 Member Invitation Flow

```
1. Admin/Owner goes to workspace settings
2. Click "Invite member"
3. Enter email and select role
4. System sends invitation email
5. Recipient clicks link
6. If not registered: signup flow
7. Accept invitation page
8. Added to workspace
9. Redirect to workspace dashboard
```

## 6. Security Considerations

### 6.1 Data Isolation

- All queries must include workspace_id filter
- RLS policies enforce at database level
- API layer double-checks permissions
- No cross-workspace data leakage

### 6.2 Permission Checks

```typescript
// Example permission check helper
export function canManageWorkspace(role: WorkspaceRole): boolean {
  return ['owner', 'admin'].includes(role)
}

export function canDeleteWorkspace(role: WorkspaceRole): boolean {
  return role === 'owner'
}

export function canInviteMembers(role: WorkspaceRole): boolean {
  return ['owner', 'admin'].includes(role)
}
```

### 6.3 Invitation Security

- Tokens are cryptographically random
- 7-day expiration
- One-time use only
- Email verification recommended
- Rate limiting on invitation sending

### 6.4 Workspace Deletion

- Soft delete with 30-day retention
- Only owner can delete
- Confirmation required
- Data anonymization after retention
- Audit log of deletion

## 7. Performance Optimizations

### 7.1 Database Indexes

```sql
-- Workspace lookup by slug
CREATE INDEX idx_workspace_slug ON workspaces(slug);

-- Member queries
CREATE INDEX idx_workspace_members_workspace ON workspace_members(workspace_id);
CREATE INDEX idx_workspace_members_user ON workspace_members(user_id);

-- Invitation lookups
CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_invitations_email ON invitations(email);
```

### 7.2 Query Optimization

- Use select specific fields
- Implement cursor pagination
- Cache workspace list in context
- Batch permission checks
- Use database views for complex queries

### 7.3 Caching Strategy

```typescript
// Cache workspace data for 5 minutes
api.workspace.list.useQuery(undefined, {
  staleTime: 5 * 60 * 1000,
  cacheTime: 10 * 60 * 1000,
})

// Invalidate on mutations
onSuccess: () => {
  utils.workspace.list.invalidate()
  utils.auth.getSession.invalidate()
}
```

## 8. Testing Strategy

### 8.1 Unit Tests

```typescript
// Test workspace creation
describe('Workspace Creation', () => {
  it('should create workspace with owner', async () => {
    const workspace = await createWorkspace({
      name: 'Test Co',
      slug: 'test-co',
      userId: 'user-123',
    })

    expect(workspace.name).toBe('Test Co')
    expect(workspace.members[0].role).toBe('owner')
  })

  it('should enforce unique slugs', async () => {
    await createWorkspace({ slug: 'test-co' })

    await expect(createWorkspace({ slug: 'test-co' })).rejects.toThrow(
      'Slug already exists'
    )
  })
})
```

### 8.2 Integration Tests

```typescript
// Test RLS policies
describe('RLS Policies', () => {
  it('should isolate workspace data', async () => {
    const user1 = await createUser()
    const user2 = await createUser()

    const workspace1 = await createWorkspace({ userId: user1.id })
    const workspace2 = await createWorkspace({ userId: user2.id })

    // User1 should only see workspace1
    const workspaces = await getWorkspacesForUser(user1.id)
    expect(workspaces).toHaveLength(1)
    expect(workspaces[0].id).toBe(workspace1.id)
  })
})
```

### 8.3 E2E Tests

```typescript
// Test complete invitation flow
test('invitation flow', async ({ page }) => {
  // Admin invites member
  await page.goto('/workspace/settings/members')
  await page.click('button:has-text("Invite member")')
  await page.fill('input[name="email"]', 'new@example.com')
  await page.selectOption('select[name="role"]', 'member')
  await page.click('button:has-text("Send invitation")')

  // Check invitation sent
  await expect(page.locator('text=Invitation sent')).toBeVisible()

  // Simulate accepting invitation
  const invitation = await getLatestInvitation()
  await page.goto(`/invitation/${invitation.token}`)
  await page.click('button:has-text("Accept invitation")')

  // Verify added to workspace
  await expect(page).toHaveURL('/dashboard')
  const members = await getWorkspaceMembers(workspace.id)
  expect(members).toContainEqual(
    expect.objectContaining({ email: 'new@example.com' })
  )
})
```

## 9. Migration Strategy

### 9.1 For Existing Users

```sql
-- Create default personal workspace for existing users
INSERT INTO workspaces (name, slug, created_at, updated_at)
SELECT
  COALESCE(full_name, email) || '''s Workspace',
  LOWER(REGEXP_REPLACE(COALESCE(full_name, email), '[^a-z0-9]+', '-', 'g')) || '-' || id,
  NOW(),
  NOW()
FROM users
WHERE NOT EXISTS (
  SELECT 1 FROM workspace_members WHERE user_id = users.id
);

-- Add users as owners of their personal workspaces
INSERT INTO workspace_members (user_id, workspace_id, role, joined_at)
SELECT
  u.id,
  w.id,
  'owner',
  NOW()
FROM users u
JOIN workspaces w ON w.slug LIKE '%' || u.id
WHERE NOT EXISTS (
  SELECT 1 FROM workspace_members WHERE user_id = u.id
);

-- Set active workspace
UPDATE users
SET active_workspace_id = (
  SELECT workspace_id
  FROM workspace_members
  WHERE user_id = users.id
  LIMIT 1
)
WHERE active_workspace_id IS NULL;
```

## 10. Future Enhancements

### 10.1 Advanced Features

- Workspace templates
- Nested workspaces/projects
- Guest access with limited permissions
- Workspace activity logs
- Usage analytics per workspace
- Billing per workspace
- API keys per workspace
- Custom domains per workspace

### 10.2 Role Extensions

- Custom roles with granular permissions
- Department-based access control
- Time-limited access
- Approval workflows for sensitive actions

### 10.3 Integration Points

- SSO/SAML for enterprise workspaces
- Webhook events for workspace changes
- Audit logs exportable to SIEM
- Compliance modes (HIPAA, SOC2)

## Implementation Checklist

- [x] Database schema created
- [x] Migrations written and tested
- [x] RLS policies implemented
- [x] tRPC routers created
- [x] Context provider implemented
- [x] UI components built (WorkspaceSwitcher)
- [ ] Workspace settings pages built
- [ ] Onboarding flow completed
- [x] Invitation system working
- [ ] Tests written and passing
- [x] Documentation updated
- [ ] Security review completed
- [ ] Performance testing done
- [x] Migration script tested
- [ ] Feature flags configured
- [ ] Monitoring alerts set up

## Files Created/Modified

### New Files Created

1. `/supabase/migrations/20250102_multi_tenancy.sql` - Complete migration
2. `/src/server/api/routers/workspace.ts` - Workspace operations
3. `/src/server/api/routers/members.ts` - Member management
4. `/src/server/api/routers/invitation.ts` - Invitation handling
5. `/src/components/workspace/WorkspaceSwitcher.tsx` - UI component
6. `/src/contexts/workspace-context.tsx` - React context
7. `/docs/multi-tenancy-implementation-summary.md` - Implementation guide

### Files Modified

1. `/prisma/schema.prisma` - Added new models
2. `/src/server/api/trpc.ts` - Enhanced context
3. `/src/server/api/routers/auth.ts` - Added workspace to session
4. `/src/server/api/root.ts` - Registered new routers
5. `/messages/*.json` - Added translations (EN, PT, ES)
