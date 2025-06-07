# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

## Project Overview

This is the **Works Boilerplate** - a production-ready SaaS starter kit designed
to accelerate development of modern Software-as-a-Service applications. The
boilerplate emphasizes:

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

Since this is a new project without implementation yet, here are the expected
commands once the boilerplate is set up:

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

1. **Mobile-First PWA**: All features must work on mobile devices with touch
   interactions. The app should be installable and work offline for critical
   features.

2. **Internationalization**: Every user-facing string must be externalized. Use
   the `useTranslations` hook from next-intl. Routes include locale prefix
   (e.g., `/en/dashboard`).

3. **Multi-Tenancy**: Data isolation is enforced at the database level using Row
   Level Security (RLS). Users can only access data within their authorized
   workspace.

4. **Type Safety**: The entire stack is type-safe from database to frontend.
   tRPC procedures share types automatically. All inputs are validated with Zod.

5. **Component Library**: All UI components are based on shadcn/ui and must be
   mobile-optimized with minimum 44x44px touch targets.

## Development Guidelines

### Core Principles

1. **Mobile-First Always**: Every feature must work perfectly on mobile before
   desktop
2. **Zero Hardcoded Strings**: All text must use next-intl translations
3. **TypeScript Strict Mode**: No `any` types, full type safety end-to-end
4. **Security by Default**: All inputs validated with Zod, RLS enforced
5. **Progressive Enhancement**: Core features work offline, enhanced features
   online

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

Documentation is not a task to be done at the end of a project; it is an ongoing
product that ensures the health, maintainability, and scalability of our team
and system, as well as clarity for other teams.

#### Documentation Philosophy

- **Document the "Why", not just the "What":** Code is self-explanatory about
  _what_ it does. Quality documentation explains _why_ it was done that way,
  what alternatives were considered, and what trade-offs were made.

- **Documentation Lives Close to the Code:** To avoid it becoming outdated, we
  prioritize documentation that can be versioned alongside the source code
  (Markdown files in the repository, TSDoc in the comments), rather than relying
  on external platforms like Confluence or Notion.

#### The three layers of our documentation

##### **The `README.md` (The Gateway)**

- **Tool:** `README.md` in the root of the monorepo.
- **Purpose:** To allow a new developer to set up the environment, install
  dependencies, and run the project locally in the shortest possible time. It is
  our "quick start guide".
- **Responsibility:** It must be kept impeccably clear and up to date. It is the
  first impression a new team member will have of our project. It should contain
  the project vision, prerequisites, step-by-step setup guide, main commands
  (`dev`, `test`, `build`), and a link to this complete Design Doc.

##### **Architectural Documentation (The Constitution)**

- **Tool:** This document (`DESIGN_DOC.md`) and a `/docs/adr` directory for new
  Architecture Decision Records (ADRs).
- **Purpose:** To explain the high-level decisions, trade-offs, system
  structure, and rationale behind our technology choices. It is the "why"
  record.
- **Responsibility:** Technical leadership is the custodian of this document.
  Significant new architectural decisions (e.g., adding a new microservice,
  changing a database provider) **should** be documented with a new ADR, which
  will be reviewed by the team.

##### **Documentation in Code (The Immediate Context)**

- **Tool:** Comments in **TSDoc** format.
- **Purpose:** To explain the "why" of code snippets that are not immediately
  obvious. We don't comment on the obvious. We do comment on:
- Complex business logic.
- The purpose of public functions and their parameters.
- Temporary workarounds or "hacks", always with a `// TODO:` and a link to the
  ticket that tracks their removal.
- **Responsibility:** Each developer. The Code Review process should actively
  look for complex code without proper documentation and request its addition.

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

## Task Completion Workflow

**IMPORTANT MEMORY**: When completing any task, you MUST:

1. **Update the original task file** with completion status and learnings
2. **Move the completed task** from `tasks/` to `tasks/completed/` directory
3. **Mark all acceptance criteria** as completed with `[x]` checkboxes
4. **Add implementation summary** at the end of the original task file
5. **Document key learnings** for future reference
6. **Update CLAUDE.md** with new implementation learnings section

Example workflow:

```bash
# After completing task E2_T2.1
mv tasks/E2_T2.1_Internationalization_Setup.md tasks/completed/
# Edit the file to add completion status and mark criteria as done
# Update CLAUDE.md with learnings
```

This ensures all completed work is properly documented and serves as reference
for future development.

## Current Status

This is a greenfield project with a comprehensive Product Requirements Document
(PRD) and detailed task breakdown. Implementation follows a 23-day roadmap:

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

- **E1_T1.1**: Next.js Project Setup (Next.js 15.3.3, React 19, TypeScript
  strict mode)
- **E1_T1.2**: Build System Configuration (Production build optimization, PWA
  setup, bundle analysis)
- **E1_T1.3**: PWA Foundation (Mobile-first PWA with offline capabilities,
  service worker caching, iOS optimization)
- **E1_T1.4**: Developer Environment Setup (ESLint, Prettier, Husky, VS Code
  optimization, mobile-first development tools)
- **E2_T2.1**: Internationalization Setup (next-intl with pt-BR, en-US, es-ES,
  mobile-optimized locale switcher, type-safe translations)
- **E2_T2.2**: Translation Management System (ICU syntax, pluralization,
  validation system, mobile-optimized content, performance optimization)
- **E2_T2.3**: Internationalized Routing (advanced SEO, localized error pages,
  sitemap generation, mobile-optimized middleware, comprehensive metadata)
- **E3_T3.1**: Tailwind CSS v4 Setup (mobile-first design system, fluid
  typography, dark mode, touch optimization, component variants, PostCSS
  pipeline)

#### 🎯 Next Task Ready

- **E3_T3.2**: Advanced Component Library Development - Building on the Tailwind
  foundation

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

- **Next.js 15 Stability**: React 19 experimental features (ppr, reactCompiler)
  require canary versions
- **Bundle Size Management**: Started with 300KB limit, optimized to 102KB
  actual size
- **PWA Integration**: next-pwa automatically generates service worker and
  manifest
- **Webpack Configuration**: Bundle analyzer works with both static reports and
  development integration
- **Database Integration**: Prisma requires postinstall script for client
  generation
- **Development Scripts**: Complete test and database management commands ready
  for future implementation

##### Production Build Optimization

- **Bundle Analysis**: Generates reports in `analyze/` and `.next/analyze/`
  directories
- **Mobile Performance**: 102KB bundle size is 32% under 150KB target
- **Tree Shaking**: Configured for optimal dead code elimination
- **SVG Support**: @svgr/webpack enables SVG-as-React-component imports
- **Security Headers**: Production-ready CSP, XSS protection, and HSTS
  configured

##### PWA Foundation Implementation

- **Service Worker Strategies**: NetworkFirst for APIs, CacheFirst for images,
  StaleWhileRevalidate for assets
- **next-pwa Configuration**: Advanced runtime caching with expiration policies
  and cacheable response filtering
- **iOS PWA Support**: Comprehensive Apple meta tags, splash screens, and touch
  icons for native app experience
- **Offline Experience**: Mobile-optimized glassmorphism design with connection
  monitoring and auto-recovery
- **PWA Manifest**: Complete with shortcuts, screenshots, protocol handlers, and
  edge side panel support
- **Mobile-First Design**: Portrait-primary orientation, touch-optimized
  interactions, viewport handling

##### PWA Development Best Practices

- **Caching Strategy**: API routes (5min), images (30 days), static assets (7
  days), pages (24 hours)
- **Offline Fallback**: Elegant `/offline` page with connection status and retry
  functionality
- **TypeScript PWA Utilities**: Installation detection, service worker
  management, network status monitoring
- **Build Integration**: Service worker auto-generation with custom runtime
  caching configuration
- **Performance Optimization**: Bundle size maintained at 102KB with PWA
  features included

##### Developer Environment Setup Implementation

- **ESLint v8 Compatibility**: ESLint v9 requires new config format, downgraded
  to v8 for stability
- **TypeScript Strict Rules**: Configured comprehensive type checking with
  mobile-first accessibility rules
- **Git Hooks Integration**: Husky + lint-staged for automated quality checks on
  commit
- **VS Code Optimization**: Complete workspace setup with mobile debugging
  configurations and recommended extensions
- **Mobile-First Validation**: Touch target compliance checking (44x44px
  minimum) built into pre-commit hooks
- **Conventional Commits**: Commitlint configuration with project-specific
  scopes (mobile, pwa, ui, etc.)
- **Code Quality Pipeline**: Zero-warning policy with auto-formatting and
  comprehensive linting
- **Performance Monitoring**: Bundle analysis integration with mobile network
  optimization targets

##### Internationalization Setup Implementation

- **next-intl Integration**: Configured with Next.js 15 App Router using new
  async params pattern
- **Locale Routing**: All routes now use `/[locale]/` prefix with automatic
  detection and persistence
- **Type-Safe Translations**: Full TypeScript integration with autocomplete for
  all translation keys
- **Mobile-First Locale Switcher**: 44px touch targets, loading states, native
  select for best mobile UX
- **Dynamic Message Loading**: Translations loaded on-demand to minimize bundle
  size impact
- **SEO Optimization**: Proper hreflang tags, locale-specific meta tags, and
  alternate URLs
- **Build Configuration**: Migrated to ES modules (next.config.mjs) for
  next-intl plugin support
- **Middleware Setup**: Automatic browser language detection with fallback to
  Portuguese (pt-BR)

##### Translation Management System Implementation

- **ICU Message Format**: Implemented comprehensive ICU syntax with
  pluralization support for complex language rules
- **Translation Validation**: Built automated validation system to detect
  missing keys and ICU syntax errors
- **Performance Optimization**: Bundle size maintained at 117KB with advanced
  i18n features included
- **Mobile Content Strategy**: Created mobile-specific translation content with
  shorter labels and touch-friendly terminology
- **Currency & Number Formatting**: Locale-specific formatting for currency
  (R$,
  $, €), dates, and numbers
- **CI/CD Integration**: Added `pnpm i18n:validate` script for automated
  translation validation
- **Type Safety Enforcement**: Enhanced TypeScript integration with strict
  validation and autocomplete
- **Namespace Organization**: Structured translations by feature domains for
  better maintainability

##### Internationalized Routing & SEO Implementation

- **Advanced Error Handling**: Created localized 404, error boundary, and
  loading pages with mobile-optimized UX
- **Comprehensive SEO Metadata**: Enhanced with Open Graph, Twitter cards,
  canonical URLs, and hreflang tags
- **Sitemap Generation**: Automated multi-language XML sitemap with alternate
  URLs for all locales
- **Mobile-Optimized Middleware**: Performance optimizations with static asset
  bypassing and mobile detection
- **SEO Best Practices**: Implemented robots.txt directives, Google
  verification, and locale-specific metadata
- **Accessibility Compliance**: ARIA labels, screen reader support, and keyboard
  navigation for language switching
- **Performance Monitoring**: Middleware overhead kept under 50ms for mobile
  networks
- **Progressive Enhancement**: Error pages work without JavaScript, fallback
  strategies implemented

##### Tailwind CSS v4 Advanced Implementation

- **v4 Migration Strategy**: Successfully upgraded from v3 with PostCSS pipeline
  optimization
- **Mobile-First Breakpoint System**: Added touch-specific media queries
  (`touch`, `no-touch`, `standalone`)
- **Fluid Typography Implementation**: Complete clamp-based responsive scaling
  with mobile-optimized line heights
- **Touch Target Compliance**: 44px minimum with comprehensive spacing utilities
  (`touch-sm`, `touch`, `touch-lg`)
- **Dark Mode Architecture**: CSS custom properties system with smooth 200ms
  transitions
- **Component Variant System**: CVA integration with TypeScript for maintainable
  component styling
- **PostCSS Pipeline Enhancement**: Modern CSS features (nesting, preset-env,
  cssnano) with build optimization
- **Bundle Size Achievement**: 117KB total (22% under 150KB mobile target) with
  advanced features included
- **Safe Area Handling**: Complete PWA support for notched devices with `env()`
  variables
- **Performance Optimization**: Tree-shaking, critical CSS inlining, and mobile
  network optimization

##### Critical Bug Resolution During Implementation

- **Layout Hierarchy Issues**: Fixed Next.js 15 hydration mismatches by
  restructuring root/locale layout relationship
- **Routing Loop Prevention**: Resolved infinite redirects by simplifying
  middleware and removing problematic `notFound()` calls
- **Translation Synchronization**: Achieved perfect server/client translation
  sync with explicit locale parameter passing
- **Build System Compatibility**: Resolved PostCSS v4 integration issues with
  autoprefixer and optimization plugins
- **TypeScript Strict Compliance**: Maintained zero `any` types throughout
  complex component variant implementations

##### Git Workflow and Commit Standards

- **Conventional Commits**: Project uses strict conventional commit format with
  commitlint validation
- **Sentence-Case Rule**: Commit subjects must be in sentence-case (only first
  word capitalized)
  - ✅ **Correct**:
    `feat: Implement advanced tailwind design system with mobile optimization`
  - ❌ **Incorrect**:
    `feat: Implement Tailwind CSS v4 Mobile-First Design System`
- **Subject Length**: Maximum 72 characters for commit subject line
- **Body Formatting**: Maximum 100 characters per line in commit body
- **Scope Validation**: Must use predefined scopes (mobile, pwa, ui, i18n, etc.)
- **Type Validation**: Must use conventional types (feat, fix, docs, style,
  etc.)
- **Husky Hooks**: Updated to remove deprecated v10.0.0 incompatible lines
- **Pre-commit Checks**: Automatic linting, TypeScript validation, mobile
  compliance, and accessibility checks
- **Package Manager**: Project uses pnpm exclusively (`.npmrc` contains
  pnpm-specific configs)
- **npm Warnings**: Normal to see npm warnings about pnpm configs - use `pnpm`
  commands only
- **IMPORTANT**: Always use sentence-case format to avoid commitlint failures

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
pnpm dev              # Development server
pnpm build            # Production build
pnpm check            # TypeScript + ESLint check
pnpm lint:fix         # Auto-fix linting issues
pnpm analyze          # Bundle analysis with visualization
pnpm clean            # Clean build artifacts

# Code Quality (NEW)
pnpm validate         # Complete validation (typecheck + lint + format check)
pnpm format           # Format all files with Prettier
pnpm format:check     # Check formatting without changes
pnpm mobile:validate  # Mobile-specific compliance checks
pnpm pre-commit       # Manual pre-commit checks

# Internationalization (NEW)
pnpm i18n:validate    # Validate translation files and ICU syntax
pnpm i18n:check       # Alias for i18n:validate
pnpm i18n:extract     # Extract translation keys (future implementation)

# Database (Prisma)
pnpm db:push          # Push schema changes
pnpm db:migrate       # Run migrations
pnpm db:studio        # Open Prisma Studio
pnpm db:seed          # Seed database
pnpm db:generate      # Generate Prisma client

# Testing (Future Implementation)
pnpm test             # Run unit tests
pnpm test:ui          # Test with UI
pnpm test:coverage    # Coverage reports
pnpm test:e2e         # End-to-end tests
```

### Next Steps

1. Run `task-master next` to see the next available task
2. Review task details with `task-master show <task-id>`
3. Follow mobile-first development principles
4. Ensure all code meets the Definition of Done criteria
5. **Use `pnpm validate` before every commit (replaces `pnpm check`)**
6. **Use `pnpm analyze` to monitor bundle size during feature development**
7. **Use `pnpm i18n:validate` to check translation consistency**
8. **Database operations ready with Prisma scripts when schema is implemented**
9. **NEW**: Git hooks automatically run quality checks on commit
10. **NEW**: VS Code workspace optimized for mobile-first development
11. **NEW**: Comprehensive internationalization system with 3 languages ready
