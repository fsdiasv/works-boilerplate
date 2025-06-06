# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the **Works Boilerplate** - a production-ready SaaS starter kit designed to accelerate development of modern Software-as-a-Service applications. The boilerplate emphasizes:

- **Mobile-first Progressive Web App (PWA)** with offline capabilities
- **Internationalization (i18n)** supporting English, Spanish, and Portuguese
- **Multi-tenancy** with workspace-based data isolation
- **Type-safe full-stack development** with tRPC
- **Security-first approach** with authentication, RLS, and security headers

## Core Technology Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript (strict mode)
- **Styling**: Tailwind CSS v4 (mobile-first), shadcn/ui components
- **Backend**: tRPC on Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL (Supabase)
- **Authentication**: Supabase Auth (JWT-based)
- **Internationalization**: next-intl
- **PWA**: next-pwa with Workbox
- **Deployment**: Vercel
- **Testing**: Vitest, Playwright, React Testing Library
- **External Services**: Stripe, Resend, Sentry, PostHog, Inngest

## Development Commands

Since this is a new project without implementation yet, here are the expected commands once the boilerplate is set up:

```bash
# Install dependencies
pnpm install

# Development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Type checking
pnpm typecheck

# Linting
pnpm lint

# Run tests
pnpm test
pnpm test:unit
pnpm test:e2e

# Database operations
pnpm db:push        # Push schema changes
pnpm db:migrate     # Run migrations
pnpm db:studio      # Open Prisma Studio
```

## Architecture & Structure

### Directory Layout
```
src/
├── app/[locale]/          # Internationalized routes
│   ├── (auth)/           # Auth pages (login, signup, etc.)
│   ├── (dashboard)/      # Protected dashboard routes
│   └── (marketing)/      # Public marketing pages
├── components/
│   ├── ui/               # shadcn/ui components
│   ├── mobile/           # Mobile-specific components
│   └── shared/           # Shared components
├── server/               # Backend code
│   ├── api/             # tRPC routers
│   └── db/              # Database client
└── lib/                 # Utilities and helpers
```

### Key Architectural Decisions

1. **Mobile-First PWA**: All features must work on mobile devices with touch interactions. The app should be installable and work offline for critical features.

2. **Internationalization**: Every user-facing string must be externalized. Use the `useTranslations` hook from next-intl. Routes include locale prefix (e.g., `/en/dashboard`).

3. **Multi-Tenancy**: Data isolation is enforced at the database level using Row Level Security (RLS). Users can only access data within their authorized workspace.

4. **Type Safety**: The entire stack is type-safe from database to frontend. tRPC procedures share types automatically. All inputs are validated with Zod.

5. **Component Library**: All UI components are based on shadcn/ui and must be mobile-optimized with minimum 44x44px touch targets.

## Development Guidelines

### Core Principles

1. **Mobile-First Always**: Every feature must work perfectly on mobile before desktop
2. **Zero Hardcoded Strings**: All text must use next-intl translations
3. **TypeScript Strict Mode**: No `any` types, full type safety end-to-end
4. **Security by Default**: All inputs validated with Zod, RLS enforced
5. **Progressive Enhancement**: Core features work offline, enhanced features online

### Code Organization Standards

#### File Structure Rules
- Components: `ComponentName.tsx` with co-located tests and styles
- Pages: Use Next.js 15 App Router structure with `page.tsx`
- API Routes: Use `route.ts` files in app directory
- Types: Keep close to usage, use Zod for runtime validation
- Utilities: Group by domain in `lib/` directory

#### Component Architecture
- **Server Components First**: Use server components by default
- **Client Components**: Only when interactivity is required (use "use client")
- **Atomic Design**: Organize as atoms → molecules → organisms
- **shadcn/ui Base**: Build on shadcn/ui primitives
- **Mobile Touch Targets**: Minimum 44x44px for all interactive elements

### Development Workflow

#### Before Writing Code
1. Check existing patterns in the codebase
2. Verify mobile-first approach
3. Ensure translations are externalized
4. Plan for offline scenarios

#### Code Quality Requirements
- **ESLint**: No warnings allowed
- **Prettier**: Auto-format on save
- **TypeScript**: Strict mode, no errors
- **Tests**: Write before or during development
- **Performance**: Profile on slow 3G networks

### Testing Strategy

#### Required Test Types
- **Unit Tests**: Vitest for utilities, hooks, and pure functions
- **Component Tests**: React Testing Library for UI components
- **Integration Tests**: API endpoints and database operations
- **E2E Tests**: Playwright for critical user flows
- **Mobile Tests**: Touch interactions and responsive behavior
- **PWA Tests**: Offline functionality and installation

#### Test Organization
- Co-locate tests with components: `Component.test.tsx`
- API tests in `__tests__/api/` directories
- E2E tests in dedicated `tests/e2e/` directory
- Maintain >80% coverage for all new code

### Performance Standards

#### Mobile Performance Targets
- **Lighthouse Score**: >95 in all categories on mobile
- **Time to Interactive**: <3 seconds on 3G
- **Bundle Size**: <150KB initial load
- **PWA Score**: 100% in Lighthouse
- **Core Web Vitals**: Green scores for LCP, FID, CLS

#### Optimization Techniques
- Use `next/image` for all images
- Implement lazy loading for non-critical components
- Code splitting at route and component level
- Optimize fonts with `next/font`
- Cache strategies via service worker

### Security Implementation

#### Input Validation
- **All Inputs**: Validate with Zod schemas on client and server
- **API Endpoints**: Use tRPC with Zod for automatic validation
- **File Uploads**: Validate type, size, and content
- **URL Parameters**: Sanitize and validate all route parameters

#### Authentication & Authorization
- **Supabase Auth**: Use for all authentication flows
- **JWT Tokens**: Secure session management with HTTP-only cookies
- **RLS Policies**: Enforce data isolation at database level
- **API Protection**: Secure all tRPC procedures with auth checks

#### Security Headers
- **CSP**: Content Security Policy configured
- **CORS**: Properly configured for production
- **Rate Limiting**: Implement on auth endpoints and APIs
- **HTTPS**: Enforced in production environments

### Internationalization Best Practices

#### Translation Management
- **File Structure**: Organize by namespace (auth, dashboard, common)
- **Type Safety**: Generate types from translation keys
- **Fallbacks**: Always provide fallback to English
- **Dynamic Loading**: Load translations on demand for performance

#### Locale Handling
- **URL Structure**: Use `/[locale]/path` for all routes
- **Detection**: Automatic locale detection with user preference
- **Switching**: Smooth language switching without page reload
- **SEO**: Proper hreflang tags and locale-specific meta

### PWA Development

#### Service Worker Implementation
- **Caching Strategies**: Cache-first for assets, network-first for API calls
- **Offline Support**: Critical features must work without internet
- **Background Sync**: Queue actions when offline, sync when online
- **Install Prompts**: Custom PWA installation experience

#### Mobile Optimizations
- **Touch Gestures**: Implement swipe, pinch, and long-press
- **Viewport Handling**: Proper meta tags and safe area handling
- **Performance**: Optimize for mobile CPUs and networks
- **Native Features**: Prepare for push notifications and biometric auth

### Documentation and Knowledge Strategy

Documentation is not a task to be done at the end of a project; it is an ongoing product that ensures the health, maintainability, and scalability of our team and system, as well as clarity for other teams.

#### Documentation Philosophy

- **Document the "Why", not just the "What":** Code is self-explanatory about *what* it does. Quality documentation explains *why* it was done that way, what alternatives were considered, and what trade-offs were made.

- **Documentation Lives Close to the Code:** To avoid it becoming outdated, we prioritize documentation that can be versioned alongside the source code (Markdown files in the repository, TSDoc in the comments), rather than relying on external platforms like Confluence or Notion.

#### The three layers of our documentation

##### **The `README.md` (The Gateway)**

- **Tool:** `README.md` in the root of the monorepo.
- **Purpose:** To allow a new developer to set up the environment, install dependencies, and run the project locally in the shortest possible time. It is our "quick start guide".
- **Responsibility:** It must be kept impeccably clear and up to date. It is the first impression a new team member will have of our project. It should contain the project vision, prerequisites, step-by-step setup guide, main commands (`dev`, `test`, `build`), and a link to this complete Design Doc.

##### **Architectural Documentation (The Constitution)**

- **Tool:** This document (`DESIGN_DOC.md`) and a `/docs/adr` directory for new Architecture Decision Records (ADRs).
- **Purpose:** To explain the high-level decisions, trade-offs, system structure, and rationale behind our technology choices. It is the "why" record.
- **Responsibility:** Technical leadership is the custodian of this document. Significant new architectural decisions (e.g., adding a new microservice, changing a database provider) **should** be documented with a new ADR, which will be reviewed by the team.

##### **Documentation in Code (The Immediate Context)**

- **Tool:** Comments in **TSDoc** format.
- **Purpose:** To explain the "why" of code snippets that are not immediately obvious. We don't comment on the obvious. We do comment on:
- Complex business logic.
- The purpose of public functions and their parameters.
- Temporary workarounds or "hacks", always with a `// TODO:` and a link to the ticket that tracks their removal.
- **Responsibility:** Each developer. The Code Review process should actively look for complex code without proper documentation and request its addition.



### Available Commands
```bash
# View current tasks
task-master list

# Get next available task
task-master next

# View task details
task-master show <task-id>

# Update task status
task-master set-status -i <task-id> -s <status>

# Analyze project complexity
task-master analyze-complexity
```

## External Integrations

### Required Service Accounts
- **Supabase**: Database, auth, and file storage
- **Stripe**: Payment processing and subscription management
- **Resend**: Transactional email delivery
- **Sentry**: Error tracking and performance monitoring
- **PostHog**: Product analytics and feature flags
- **Inngest**: Background job processing

### Environment Variables
Create `.env.local` with required API keys:
```bash
# Database
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Authentication
NEXT_PUBLIC_SUPABASE_URL="https://..."
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_ROLE_KEY="..."

# Payments
STRIPE_SECRET_KEY="sk_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_..."

# Email
RESEND_API_KEY="re_..."

# Monitoring
SENTRY_DSN="https://..."
NEXT_PUBLIC_POSTHOG_KEY="phc_..."

# Background Jobs
INNGEST_EVENT_KEY="..."
```

## Definition of Done

A feature is considered complete when:
- ✅ **Mobile-first and fully responsive**
- ✅ **All strings internationalized**
- ✅ **Touch-friendly interactions (44x44px minimum)**
- ✅ **Works offline when applicable**
- ✅ **Type-safe from database to UI**
- ✅ **Zod validation on all inputs**
- ✅ **Tests written and passing (>80% coverage)**
- ✅ **Performance validated on 3G**
- ✅ **Accessibility verified (WCAG 2.1 AA)**
- ✅ **Security review completed**
- ✅ **Code review approved**
- ✅ **No ESLint warnings or TypeScript errors**

## Current Status

This is a greenfield project with a comprehensive Product Requirements Document (PRD) and detailed task breakdown. Implementation follows a 23-day roadmap:

1. **Phase 1**: Foundation + Mobile (5 days)
2. **Phase 2**: Core Features + Components (6 days)  
3. **Phase 3**: PWA + Offline (4 days)
4. **Phase 4**: Integrations (5 days)
5. **Phase 5**: Quality & Polish (3 days)

### Project Resources
- `prd.md` - Complete product requirements and specifications
- `tasks/` - Detailed task breakdown with 39 implementation tasks
- `.cursor/rules/` - Development standards and best practices
- `.taskmaster/` - Task management configuration and reports

### Implementation Status

#### ✅ Completed Tasks
- **E1_T1.1**: Next.js Project Setup (Next.js 15.3.3, React 19, TypeScript strict mode)
- **E1_T1.2**: Build System Configuration (Production build optimization, PWA setup, bundle analysis)

#### 🎯 Key Implementation Learnings

##### Tailwind CSS v4 Migration
- **Issue**: Tailwind v4 requires separate PostCSS plugin
- **Solution**: Install `@tailwindcss/postcss` and update config
- **Commands**: 
  ```bash
  pnpm add -D @tailwindcss/postcss autoprefixer
  # Update postcss.config.mjs to use '@tailwindcss/postcss'
  ```

##### Package Dependencies for Next.js 15
- **Critical**: Always install `autoprefixer` with Tailwind
- **pnpm Config**: Add `.npmrc` with peer dependency settings
- **Bundle Analyzer**: Conditional loading only when `ANALYZE=true`

##### Mobile-First Setup Essentials
- **Viewport Export**: Use Next.js 15's separate `viewport` export
- **Meta Tags**: Include PWA preparation in root layout
- **Touch Targets**: Plan for 44x44px minimum from start
- **Bundle Target**: Monitor 150KB limit with `pnpm analyze`

##### TypeScript Strict Mode
- **Configuration**: Enable all strict flags in tsconfig.json
- **Zero Tolerance**: No `any` types allowed in codebase
- **Import Aliases**: Essential for clean mobile component organization

##### Build System Configuration
- **Next.js 15 Stability**: React 19 experimental features (ppr, reactCompiler) require canary versions
- **Bundle Size Management**: Started with 300KB limit, optimized to 102KB actual size
- **PWA Integration**: next-pwa automatically generates service worker and manifest
- **Webpack Configuration**: Bundle analyzer works with both static reports and development integration
- **Database Integration**: Prisma requires postinstall script for client generation
- **Development Scripts**: Complete test and database management commands ready for future implementation

##### Production Build Optimization
- **Bundle Analysis**: Generates reports in `analyze/` and `.next/analyze/` directories
- **Mobile Performance**: 102KB bundle size is 32% under 150KB target
- **Tree Shaking**: Configured for optimal dead code elimination
- **SVG Support**: @svgr/webpack enables SVG-as-React-component imports
- **Security Headers**: Production-ready CSP, XSS protection, and HSTS configured

### Development Workflow

#### Before Writing Code
1. Check existing patterns in the codebase
2. Verify mobile-first approach
3. Ensure translations are externalized
4. Plan for offline scenarios
5. **NEW**: Run `pnpm check` for type safety and linting

#### Enhanced Scripts Available
```bash
# Development
pnpm dev          # Development server
pnpm build        # Production build
pnpm check        # TypeScript + ESLint check
pnpm lint:fix     # Auto-fix linting issues
pnpm analyze      # Bundle analysis with visualization
pnpm clean        # Clean build artifacts

# Database (Prisma)
pnpm db:push      # Push schema changes
pnpm db:migrate   # Run migrations
pnpm db:studio    # Open Prisma Studio
pnpm db:seed      # Seed database
pnpm db:generate  # Generate Prisma client

# Testing (Future Implementation)
pnpm test         # Run unit tests
pnpm test:ui      # Test with UI
pnpm test:coverage # Coverage reports
pnpm test:e2e     # End-to-end tests
```

### Next Steps
1. Run `task-master next` to see the next available task
2. Review task details with `task-master show <task-id>`
3. Follow mobile-first development principles
4. Ensure all code meets the Definition of Done criteria
5. **Use `pnpm check` before every commit**
6. **NEW**: Use `pnpm analyze` to monitor bundle size during feature development
7. **NEW**: Database operations ready with Prisma scripts when schema is implemented