# Overview
This document outlines the requirements for the **Works Boilerplate v1.0**, a production-ready, opinionated starter kit for building modern Software-as-a-Service (SaaS) applications.

The primary problem this boilerplate solves is the significant time and effort wasted on repetitive setup tasks for new projects. Engineering teams spend weeks configuring architecture, security, authentication, and tooling instead of building features. This leads to inconsistent standards, potential security vulnerabilities, and a slow time-to-market.

This boilerplate is for internal engineering teams, including full-stack developers, DevOps engineers, and technical leadership. It provides a "golden path" that encapsulates our best practices, allowing teams to launch secure, scalable, and globally-ready products in hours, not weeks.

The core value is a massive acceleration in development velocity. By providing a foundation that is mobile-first, installable as a Progressive Web App (PWA), and internationalized from day one, it eliminates foundational debt and allows teams to focus exclusively on delivering unique business value.

# Core Features
-   **Mobile-First Progressive Web App (PWA) Foundation**
    -   **What it does:** Provides a complete PWA setup, including a Web App Manifest, a caching Service Worker, and offline fallback pages. The entire architecture is designed with a mobile-first philosophy.
    -   **Why it's important:** It ensures a seamless, fast, and engaging user experience on any device, even with poor network connectivity. It allows the web application to be "installed" on a user's home screen, increasing retention and accessibility.
    -   **How it works at a high level:** Utilizes `next-pwa` and a custom Service Worker to manage caching strategies (e.g., cache-first for assets, stale-while-revalidate for API data) and handle offline states gracefully.

-   **Global-Ready Internationalization (i18n)**
    -   **What it does:** Implements a complete multi-language system supporting English, Spanish, and Portuguese out-of-the-box, with a clear structure for adding more languages.
    -   **Why it's important:** It enables products to reach a global audience from launch without requiring significant refactoring. It's a strategic advantage that removes barriers to international expansion.
    -   **How it works at a high level:** Uses the `next-intl` library for type-safe translations, locale-based routing (e.g., `/en/dashboard`), and automatic user locale detection.

-   **Comprehensive & Accessible UI System**
    -   **What it does:** Delivers a complete set of UI components built on `shadcn/ui` and `Tailwind CSS`. Every component is responsive, touch-friendly, accessible (WCAG 2.1 AA), and supports dark mode.
    -   **Why it's important:** It ensures a consistent, high-quality, and inclusive user experience across the entire application. It drastically speeds up front-end development by providing a ready-made, customizable design system.
    -   **How it works at a high level:** `shadcn/ui` provides the component primitives, which are styled with mobile-first `Tailwind CSS` utility classes. `class-variance-authority` (CVA) is used to manage component variants.

-   **Secure Authentication & Multi-Tenancy**
    -   **What it does:** Implements a full authentication system (email/password, OAuth) and a workspace-based multi-tenancy model with data isolation enforced at the database level.
    -   **Why it's important:** Security is non-negotiable. This feature provides a robust, pre-configured solution for the most critical security aspects of a SaaS application: user identity and data segregation.
    -   **How it works at a high level:** Leverages Supabase Auth for identity management. Prisma models define the relationship between Users, Workspaces, and Members. PostgreSQL's Row Level Security (RLS) ensures a user can only access data within their authorized workspace.

-   **Type-Safe Full-Stack API**
    -   **What it does:** Provides a fully-configured, end-to-end type-safe API layer.
    -   **Why it's important:** It eliminates an entire class of bugs related to client-server data mismatches, enables superior autocompletion, and dramatically improves developer productivity and confidence.
    -   **How it works at a high level:** Uses `tRPC` to allow the front-end to call back-end functions directly, with shared TypeScript types. All API inputs are automatically validated using `Zod`.

-   **Production-Grade Security by Default**
    -   **What it does:** Integrates a multi-layered security posture, including essential security headers, rate limiting, secure session management, and automated dependency scanning.
    -   **Why it's important:** It establishes a strong security baseline from the start, protecting the application and its users from common web vulnerabilities.
    -   **How it works at a high level:** Implements `helmet` for security headers, `@upstash/ratelimit` for abuse protection, and `Dependabot` for vulnerability scanning. All security practices are automated and enforced via CI/CD pipelines.

# User Experience
-   **User Personas**
    -   **Primary Persona: Alex, the Senior Full-Stack Engineer.** Alex's goal is to ship high-quality features as quickly as possible. They value clear patterns, automation, and a boilerplate that "just works" so they can focus on complex business logic, not on configuration. They expect a top-tier developer experience with fast builds, hot reloading, and type-safety.

-   **Key User Flows**
    -   **Developer Flow 1: Project Initialization:**
        1.  Alex clones the boilerplate repository.
        2.  Runs `pnpm install` to set up dependencies.
        3.  Copies `.env.example` to `.env` and fills in the necessary Supabase and Stripe keys.
        4.  Runs `pnpm run dev` and sees the fully functional marketing page, login page, and dashboard running locally in under 10 minutes.
    -   **Developer Flow 2: Building a New Feature:**
        1.  Alex creates a new tRPC procedure in the backend for a new data entity.
        2.  Creates a new page in the `app/[locale]/dashboard` directory.
        3.  Imports and uses pre-built `shadcn/ui` components (`Card`, `Table`, `Button`) to build the UI.
        4.  Calls the new tRPC procedure from the front-end with full type-safety and autocompletion.
    -   **End-User Flow (Example):**
        1.  A new user visits the application and lands on the internationalized marketing page.
        2.  They sign up for an account using Google OAuth.
        3.  After successful authentication, they are redirected to a protected dashboard.
        4.  They can switch the application's language and theme using the provided UI controls.
        5.  The app prompts them to "Install to Home Screen" for a native-like experience.

-   **UI/UX Considerations**
    -   **Mobile-First:** All design and development starts with the mobile viewport.
    -   **Touch-Friendly:** All interactive elements have a minimum tap target of 44x44px.
    -   **Accessibility:** WCAG 2.1 AA compliance is a requirement, ensuring keyboard navigability and screen reader support.
    -   **Dark Mode:** A seamless, first-class dark mode is available and respects user system preferences.
    -   **Responsiveness:** Utilizes fluid typography and container queries for a truly adaptive layout on any screen size.

# Technical Architecture
-   **System Components**
    -   **Frontend:** Next.js 15 App Router, React 19, Tailwind CSS.
    -   **Backend/API:** tRPC running on Next.js API Routes.
    -   **Database:** PostgreSQL hosted on Supabase.
    -   **Authentication:** Supabase Auth (JWT-based).
    -   **ORM:** Prisma.
    -   **UI Components:** shadcn/ui.
    -   **Internationalization:** next-intl.
    -   **PWA:** next-pwa.
    -   **CI/CD:** GitHub Actions.
    -   **Hosting:** Vercel.

-   **Data Models**
    -   The core data structure is centered around Users, Workspaces, and Subscriptions, enabling a standard multi-tenant SaaS model. See Appendix for the full Prisma schema.

-   **APIs and Integrations**
    -   **Internal API:** A unified, type-safe API is provided via tRPC.
    -   **External Integrations:**
        -   **Supabase:** For database, authentication, and file storage.
        -   **Stripe:** For billing and subscription management.
        -   **Resend:** For transactional emails.
        -   **Sentry:** For error tracking and performance monitoring.
        -   **PostHog:** For product analytics and feature flags.
        -   **Inngest:** For background jobs and async tasks.

-   **Infrastructure Requirements**
    -   A Vercel account for hosting and deployments.
    -   A Supabase project for the backend infrastructure.
    -   A GitHub repository for version control and CI/CD.
    -   Accounts for other integrated services (Stripe, Sentry, etc.).

# Development Roadmap
-   **MVP (v1.0) Requirements: The Production-Ready Foundation**
    -   **Phase 1: Core Setup & UI Foundation**
        -   Next.js 15, TypeScript, and Tailwind CSS configuration.
        -   Basic PWA setup (Manifest, empty Service Worker).
        -   Installation and configuration of `shadcn/ui`.
        -   Creation of essential UI components (`Button`, `Card`, `Input`, `Layouts`).
        -   Mobile-first responsive layouts and dark mode.
    -   **Phase 2: Authentication & Data Layer**
        -   Prisma schema setup (User, Workspace, etc.).
        -   Full Supabase Auth integration (Email/Pass, OAuth).
        -   Implementation of login, signup, and forgot password pages.
        -   Protected routes and session management.
        -   tRPC server setup with user context.
    -   **Phase 3: Core Features & Polish**
        -   Full internationalization setup with `next-intl` (EN, ES, PT).
        -   Complete PWA implementation with offline caching strategies.
        -   Multi-tenancy logic with Row Level Security (RLS).
        -   Basic Stripe integration for checkout.
        -   Essential security measures (Headers, Rate Limiting).
        -   Comprehensive test suite (Unit, Integration, E2E).

-   **Future Enhancements**
    -   **v1.1:** Advanced push notifications, biometric authentication support, and additional languages.
    -   **v1.2:** Native app wrappers (Capacitor), advanced mobile gestures (swipe-to-action), and an offline-first architecture for specific features.
    -   **v2.0:** A potential React Native version for true native development, multi-regional deployment strategies, and edge computing support.

# Logical Dependency Chain
1.  **Project Foundation:** The absolute first step is setting up the Next.js project with TypeScript, ESLint, Prettier, and Tailwind CSS. This creates the canvas on which everything else is painted.
2.  **Visible UI Shell:** Immediately create the main application layout (`app/[locale]/layout.tsx`) and the core, unstyled `shadcn/ui` components. This provides a fast path to a visible, tangible front-end that can be iterated upon.
3.  **Authentication Core:** Implement the full Supabase Auth flow. This is the central pillar of any SaaS. It includes the data model (`User`), the UI (login/signup pages), and the API logic. A secure, working auth system is a prerequisite for almost everything else.
4.  **Connect UI to Auth:** Integrate tRPC to link the front-end to the backend. Create a simple, protected dashboard page that is only visible to logged-in users. This completes the core user loop and creates a working, end-to-end slice of the application.
5.  **Layer on Core SaaS Features:** With the foundation in place, build out the remaining core features in parallel or sequence:
    -   **Internationalization:** Wrap the UI in the i18n provider and externalize strings.
    -   **Multi-Tenancy:** Introduce the `Workspace` model and implement RLS policies.
    -   **PWA Capabilities:** Flesh out the Service Worker and offline strategies.
6.  **Integrate External Services:** With the application's core logic stable, integrate third-party services like Stripe for payments and Sentry for monitoring.
7.  **Harden and Test:** The final step before considering the MVP complete is to write comprehensive tests for all features and implement the full suite of security measures.

# Risks and Mitigations
-   **Technical Challenges**
    -   **Risk:** The complexity of implementing a robust offline strategy for the PWA can be high.
    -   **Mitigation:** Start with simple caching strategies (e.g., caching static assets and API GET requests) and iterate. Defer complex offline data synchronization to a future version.
    -   **Risk:** Ensuring seamless i18n across all components, emails, and error messages.
    -   **Mitigation:** Enforce a strict "no hardcoded strings" policy in code reviews. Use type-safe translation keys to catch missing translations at compile time.
-   **Figuring out the MVP**
    -   **Risk:** Over-engineering the boilerplate with too many features, making it complex and difficult to maintain ("Boilerplate Bloat").
    -   **Mitigation:** Adhere strictly to the defined MVP scope. Every feature included must solve a universal problem faced by >90% of our SaaS projects. Defer niche or overly specific features to application-level code.
-   **Resource Constraints**
    -   **Risk:** The initial time investment to build the boilerplate correctly might delay the start of the primary product (Socialworks).
    -   **Mitigation:** Frame the boilerplate as "Week 0" of the Socialworks project. The time invested will be recouped multiple times over during the project's lifecycle and on all future projects.

# Appendix
-   **Prisma Schema (v1.0)**
    ```prisma
    generator client {
      provider = "prisma-client-js"
    }

    datasource db {
      provider  = "postgresql"
      url       = env("DATABASE_URL")
      directUrl = env("DIRECT_URL")
    }

    model User {
      id                String             @id @default(uuid())
      email             String             @unique
      name              String?
      avatarUrl         String?
      preferredLocale   String?            @default("en")
      stripeCustomerId  String?            @unique
      createdAt         DateTime           @default(now())
      updatedAt         DateTime           @updatedAt
      workspaceMembers  WorkspaceMember[]
      createdWorkspaces Workspace[]
    }

    model Workspace {
      id                   String             @id @default(uuid())
      name                 String
      slug                 String             @unique
      createdById          String
      stripeSubscriptionId String?            @unique
      stripePriceId        String?
      subscriptionStatus   SubscriptionStatus @default(TRIAL)
      trialEndsAt          DateTime?
      createdAt            DateTime           @default(now())
      updatedAt            DateTime           @updatedAt
      
      createdBy User                @relation(fields: [createdById], references: [id])
      members   WorkspaceMember[]
    }

    model WorkspaceMember {
      userId      String
      workspaceId String
      role        MemberRole @default(MEMBER)
      joinedAt    DateTime   @default(now())
      
      user      User      @relation(fields: [userId], references: [id])
      workspace Workspace @relation(fields: [workspaceId], references: [id])
      
      @@id([userId, workspaceId])
    }

    enum MemberRole {
      OWNER
      ADMIN
      MEMBER
    }

    enum SubscriptionStatus {
      TRIAL
      ACTIVE
      CANCELED
      PAST_DUE
      UNPAID
    }
    ```

-   **Definition of Done (DoD)**
    A feature is considered "done" when:
    -   It is implemented and functional.
    -   It is mobile-first and fully responsive.
    -   All user-facing strings are internationalized.
    -   It has a graceful offline state, where applicable.
    -   All interactions are touch-friendly.
    -   Unit, integration, and/or E2E tests are written and passing with >80% coverage.
    -   It is documented.
    -   It has been approved in a code review.
    -   It passes all linter and type-checking rules.
    -   Its performance has been validated on a simulated 3G network.
    -   Its accessibility has been verified.

-   **Success Metrics**
    -   **Quantitative:**
        -   Setup Time: < 10 minutes from `git clone` to `pnpm run dev`.
        -   Lighthouse Score (Mobile): > 95 across all categories, including PWA.
        -   Time to Interactive (3G): < 3 seconds.
    -   **Qualitative:**
        -   Developer feedback indicates a significant reduction in setup friction and an increase in productivity.
        -   The boilerplate is adopted as the standard for all new SaaS projects.
        -   Core features (auth, UI, i18n) work flawlessly out-of-the-box.


   # Executive Summary

   ## 1.1 Problem
   Every new SaaS project consumes weeks in repetitive configurations, creating inconsistencies across projects and delaying time-to-market. The absence of a standardized foundation results in:
   - Manual setup of 20+ tools
   - Rework on security configurations
   - Divergence of standards between projects
   - Vulnerabilities from improper configurations
   - Lack of mobile and offline support by default

   ## 1.2 Solution
   A complete and opinionated SaaS boilerplate that encapsulates all architectural decisions, configurations, and integrations needed to start a project in hours, not weeks. With a focus on **mobile-first**, **PWA**, and **internationalization** from the start.

   ## 1.3 Expected Impact
   - **90% reduction** in initial setup time
   - **100% compliance** with security standards
   - **Complete standardization** of the stack across projects
   - **Accelerated time-to-market** for new products
   - **Global reach** with native multi-language support

   # 2. Scope and Objectives

   ## 2.1 Primary Objectives
   1. **Create a production-ready foundation** with all tools configured
   2. **Implement security by default** at all layers
   3. **Establish automated and enforced coding standards**
   4. **Provide functional examples** of all critical flows
   5. **Ensure a mobile-first experience** and PWA capabilities
   6. **Support multi-language** from the beginning

   ## 2.2 Secondary Objectives
   - Serve as living documentation of best practices
   - Facilitate onboarding of new developers
   - Reduce initial technical debt
   - Ensure scalability from the start
   - Allow international expansion without refactoring

   ## 2.3 Out of Scope
   - Specific business logic
   - Elaborate UI/UX beyond the base design system
   - Customer-specific production configurations
   - Integrations with external APIs beyond the essential ones

   # 3. Detailed Functional Requirements

   ## 3.1 Core Infrastructure (CORE)

   #### CORE-1: Project Structure
   **Description:** Next.js monorepo with a scalable and organized structure
   **Acceptance Criteria:**
   - [ ] Next.js 15+ with App Router configured
   - [ ] TypeScript 5+ in strict mode
   - [ ] Standardized folder structure (app, components, lib, server)
   - [ ] Import aliases configured (@/)
   - [ ] React 19 with optimized Server Components
   - [ ] **Mobile-first architecture**
   - [ ] **PWA manifest and service worker**

   #### CORE-2: Build System
   **Description:** Optimized and configured build pipeline
   **Acceptance Criteria:**
   - [ ] next.config.js with production optimizations
   - [ ] Automatic build types checking
   - [ ] Bundle analyzer configured
   - [ ] Source maps for debugging
   - [ ] **PWA build configuration**
   - [ ] **Workbox integration for offline caching**

   #### CORE-3: Progressive Web App (PWA)
   **Description:** Complete PWA capabilities
   **Acceptance Criteria:**
   - [ ] Web App Manifest configured
   - [ ] Service Worker with cache strategies
   - [ ] Offline fallback pages
   - [ ] Background sync for offline operations
   - [ ] Push notifications ready
   - [ ] App install prompt

   ## 3.2 Internationalization (I18N)

   #### I18N-1: Internationalization System
   **Description:** Complete multi-language support with next-intl (pt-BR, en, es)
   **Acceptance Criteria:**
   - [ ] next-intl configured
   - [ ] Automatic locale detection
   - [ ] Language switcher component
   - [ ] RTL support ready
   - [ ] Pluralization rules
   - [ ] Date/time formatting
   - [ ] Number/currency formatting

   #### I18N-2: Translation Structure
   **Description:** Organization and management of translations
   **Acceptance Criteria:**
   - [ ] File structure by language
   - [ ] Namespaces for organization
   - [ ] Type-safe translations
   - [ ] Fallback language (en-US)
   - [ ] Dynamic loading of translations
   - [ ] Translation keys validation

   #### I18N-3: Internationalized Routes
   **Description:** URLs with support for multiple languages
   **Acceptance Criteria:**
   - [ ] Routes with language prefix (/pt, /en, /es)
   - [ ] Redirect based on preference
   - [ ] SEO tags by language
   - [ ] Multi-language sitemap
   - [ ] Automatic hreflang tags

   ## 3.3 User Interface (UI)

   #### UI-1: Mobile-First Design System
   **Description:** Fundamental UI components with Tailwind CSS v4 and shadcn/ui
   **Acceptance Criteria:**
   - [ ] Tailwind CSS v4 configured with mobile-first
   - [ ] PostCSS with essential plugins
   - [ ] Native dark mode
   - [ ] **shadcn/ui as a component base**
   - [ ] **Touch-friendly components**
   - [ ] **Gesture support (swipe, pinch)**
   - [ ] **Optimized viewport meta tags**

   #### UI-2: shadcn/ui Components
   **Description:** Complete library of shadcn/ui components
   **Acceptance Criteria:**
   - [ ] shadcn/ui CLI configured
   - [ ] All core components installed:
   - [ ] Accordion, Alert, AlertDialog
   - [ ] AspectRatio, Avatar, Badge
   - [ ] Button, Calendar, Card
   - [ ] Checkbox, Collapsible, Command
   - [ ] ContextMenu, Dialog, Drawer
   - [ ] DropdownMenu, Form, HoverCard
   - [ ] Input, Label, Menubar
   - [ ] NavigationMenu, Popover, Progress
   - [ ] RadioGroup, ScrollArea, Select
   - [ ] Separator, Sheet, Skeleton
   - [ ] Slider, Switch, Table
   - [ ] Tabs, Textarea, Toast
   - [ ] Toggle, Tooltip
   - [ ] Integrated theme customization
   - [ ] Variants with CVA configured
   - [ ] **Mobile adaptations for all components**

   #### UI-3: Mobile Navigation
   **Description:** Optimized navigation for mobile
   **Acceptance Criteria:**
   - [ ] Bottom navigation bar
   - [ ] Swipe gestures for navigation
   - [ ] Pull-to-refresh
   - [ ] Sticky headers with hide on scroll
   - [ ] Mobile-optimized sidebar (drawer)
   - [ ] Touch-friendly tap targets (min 44x44px)

   #### UI-4: Responsive Layouts
   **Description:** Truly responsive layouts
   **Acceptance Criteria:**
   - [ ] Mobile-first breakpoints
   - [ ] Container queries where appropriate
   - [ ] Fluid typography
   - [ ] Responsive images with srcset
   - [ ] Adaptive loading (different assets per device)
   - [ ] Viewport-based units usage

   ## 3.4 Authentication and Authorization (AUTH)

   #### AUTH-1: Complete Authentication System
   **Description:** Full authentication flow with Supabase Auth
   **Acceptance Criteria:**
   - [ ] Sign Up, Sign In, Forgot Password pages
   - [ ] Email verification flow
   - [ ] OAuth providers (Google, Facebook)
   - [ ] Session management with secure cookies
   - [ ] Refresh token handling
   - [ ] **Mobile-optimized auth forms**
   - [ ] **Remember device option**

   ## 3.5 API and Backend (API)

   #### API-1: tRPC Configuration
   **Description:** Type-safe API with fully configured tRPC
   **Acceptance Criteria:**
   - [ ] tRPC server and client configured
   - [ ] Context with user authentication
   - [ ] Standardized error handling
   - [ ] Procedures examples (query, mutation)
   - [ ] Zod validation on all endpoints

   ## 3.6 Database (DB)

   #### DB-1: Complete Prisma Schema
   **Description:** Initial schema with all base entities
   **Acceptance Criteria:**
   ```prisma
   - [ ] User model with essential fields and preferredLocale
   - [ ] Workspace model with multi-tenancy and defaultLocale
   - [ ] WorkspaceMember for associations
   - [ ] Subscription model for billing
   - [ ] UserPreferences model (theme, language, notifications)
   - [ ] Audit fields (createdAt, updatedAt)
   ```

   ## 3.7 Developer Experience (DEVX)

   #### DEVX-5: Mobile Development Tools
   **Description:** Tools for mobile development
   **Acceptance Criteria:**
   - [ ] Device preview tools
   - [ ] Touch event debugging
   - [ ] Network throttling for 3G/4G
   - [ ] Responsive design mode shortcuts
   - [ ] Mobile performance profiling

   ## 3.8 Testing (TEST)

   #### TEST-4: Mobile Testing
   **Description:** Specific tests for mobile
   **Acceptance Criteria:**
   - [ ] Touch interaction tests
   - [ ] Viewport tests
   - [ ] Offline functionality tests
   - [ ] PWA installation tests
   - [ ] Performance tests on limited devices

   ## 3.9 Observability (OBS)

   #### OBS-5: Mobile Analytics
   **Description:** Specific analytics for mobile
   **Acceptance Criteria:**
   - [ ] Device type tracking
   - [ ] Connection speed monitoring
   - [ ] Offline usage patterns
   - [ ] PWA installation tracking
   - [ ] Mobile-specific events

   ## 3.10 Performance (PERF)

   #### PERF-1: Mobile Performance
   **Description:** Optimizations for mobile devices
   **Acceptance Criteria:**
   - [ ] Lazy loading of images and components
   - [ ] Resource hints (preconnect, prefetch)
   - [ ] Critical CSS inline
   - [ ] Font subsetting
   - [ ] Modern image formats (WebP, AVIF)
   - [ ] Reduced motion support

   ## 3.11 Security (SEC)

   #### SEC-1: Essential Security Headers
   **Description:** Basic HTTP headers for protection against common attacks
   **Acceptance Criteria:**
   - [ ] Helmet.js configured with defaults
   - [ ] CORS configured correctly
   - [ ] Basic CSP (blocking untrusted inline scripts)
   - [ ] HTTPS enforced in production

   #### SEC-2: Basic Rate Limiting
   **Description:** Protection against API abuse
   **Acceptance Criteria:**
   - [ ] Global rate limiting (100 req/min per IP)
   - [ ] Rate limiting on auth endpoints (5 attempts/min)
   - [ ] Appropriate error messages

   #### SEC-3: Secure Authentication
   **Description:** Secure implementation of authentication with Supabase
   **Acceptance Criteria:**
   - [ ] Passwords with a minimum of 8 characters
   - [ ] Secure session management (HttpOnly cookies)
   - [ ] Logout completely clears the session
   - [ ] Password reset with temporary tokens
   - [ ] Mandatory email verification

   #### SEC-4: Data Validation
   **Description:** Protection against injection and malicious data
   **Acceptance Criteria:**
   - [ ] Zod validation on all user inputs
   - [ ] Automatic sanitization via Prisma
   - [ ] File upload with type and size validation
   - [ ] Protection against open redirects

   #### SEC-5: Row Level Security (RLS)
   **Description:** Data isolation between workspaces
   **Acceptance Criteria:**
   - [ ] Basic RLS policies implemented
   - [ ] User can only access their own workspace data
   - [ ] Automated isolation tests
   - [ ] Documentation of the policies

   #### SEC-6: Secrets Management
   **Description:** Protection of credentials and keys
   **Acceptance Criteria:**
   - [ ] Environment variables via T3 Env
   - [ ] Zero secrets in the code or client-side
   - [ ] .env.example without real values
   - [ ] Clear instructions for key rotation

   #### SEC-7: Minimal Auditing
   **Description:** Basic logs for security
   **Acceptance Criteria:**
   - [ ] Log of login attempts (success/failure)
   - [ ] Log of critical changes (password, email)
   - [ ] Logs without sensitive data (PII)
   - [ ] Log retention for 30 days

   #### SEC-8: Basic Security Tests
   **Description:** Minimal security validation
   **Acceptance Criteria:**
   - [ ] `pnpm audit` in CI/CD
   - [ ] Dependabot activated
   - [ ] Automated RLS tests
   - [ ] Security checklist in the PR template

   # 4. Non-Functional Requirements

   ## 4.1 Performance
   - Time to First Byte (TTFB) < 200ms
   - Lighthouse score > 95 in all metrics
   - Bundle size < 150KB (initial load mobile)

   ## 4.2 Accessibility
   - WCAG 2.1 Level AA compliance
   - Screen reader compatibility
   - Complete keyboard navigation
   - Minimum touch targets of 44x44px
   - Adequate color contrast ratios

   ## 4.3 Mobile Experience
   - 100% touch-friendly
   - Works offline for critical features
   - Installable as a native app
   - Push notifications support
   - Biometric authentication ready

   ## 4.4 Internationalization
   - Initial support for pt-BR, en-US, es-ES
   - Easy addition of new languages
   - All strings externalized
   - Appropriate cultural formatting

   ## 4.5 Security
   - **OWASP Top 10** awareness (not necessarily full compliance)
   - **Zero critical vulnerabilities** in dependencies
   - **Mandatory HTTPS** in production
   - **Secure authentication** with Supabase
   - **Input validation** in 100% of cases
   - **Data isolation** via RLS

   # 5. Detailed File Structure (Updated)

   ```
   works-boilerplate/
   ├── public/
   │   ├── fonts/                     # Local fonts
   │   ├── images/                    # Static images
   │   ├── locales/                   # Translation files
   │   │   ├── pt-BR/
   │   │   │   ├── common.json
   │   │   │   ├── auth.json
   │   │   │   ├── dashboard.json
   │   │   │   └── ...
   │   │   ├── en-US/
   │   │   └── es-ES/
   │   ├── manifest.json              # PWA manifest
   │   ├── icons/                     # PWA icons (various sizes)
   │   ├── splash/                    # PWA splash screens
   │   └── offline.html               # Offline fallback
   ├── src/
   │   ├── app/
   │   │   ├── [locale]/              # Internationalized routes
   │   │   │   ├── (auth)/
   │   │   │   ├── (dashboard)/
   │   │   │   ├── (marketing)/
   │   │   │   └── layout.tsx
   │   │   ├── manifest.ts            # Dynamic manifest
   │   │   └── service-worker.ts      # Service worker
   │   ├── components/
   │   │   ├── ui/                    # shadcn/ui components
   │   │   │   ├── accordion.tsx
   │   │   │   ├── alert-dialog.tsx
   │   │   │   ├── button.tsx
   │   │   │   ├── card.tsx
   │   │   │   ├── dialog.tsx
   │   │   │   ├── drawer.tsx         # Mobile drawer
   │   │   │   ├── sheet.tsx          # Mobile sheet
   │   │   │   └── ... (all shadcn components)
   │   │   ├── mobile/                # Mobile-specific components
   │   │   │   ├── bottom-nav.tsx
   │   │   │   ├── pull-to-refresh.tsx
   │   │   │   ├── touch-menu.tsx
   │   │   │   └── install-prompt.tsx
   │   │   └── shared/
   │   │       ├── language-switcher.tsx
   │   │       └── ...
   │   ├── hooks/
   │   │   ├── use-media-query.ts
   │   │   ├── use-online.ts
   │   │   ├── use-pwa.ts
   │   │   └── use-locale.ts
   │   ├── lib/
   │   │   ├── i18n/
   │   │   │   ├── config.ts
   │   │   │   ├── provider.tsx
   │   │   │   └── utils.ts
   │   │   └── pwa/
   │   │       ├── sw-config.ts
   │   │       └── offline-queue.ts
   ├── components.json                # shadcn/ui config
   ├── next.config.js                 # Next.js + PWA config
   ├── tailwind.config.ts             # Mobile-first config
   └── ...
   ```

   # 6. Implementation Flow (Updated)

   ## 6.1 Phase 1: Foundation + Mobile (5 days)
   1. **Initial project setup**
      - Next.js 15 with strict TypeScript
      - Mobile-first Tailwind configuration
      - Basic PWA setup
      - shadcn/ui installation

   2. **Base internationalization**
      - next-intl setup
      - Locale structure
      - Basic translations

   ## 6.2 Phase 2: Core Features + Components (6 days)
   1. **Component system**
      - All shadcn/ui components
      - Mobile adaptations
      - Touch interactions

   2. **Auth + Database**
      - Supabase with locale support
      - Mobile-optimized auth

   ## 6.3 Phase 3: PWA + Offline (4 days)
   1. **Progressive Web App**
      - Complete service worker
      - Offline strategies
      - Install flow

   2. **Mobile optimizations**
      - Performance tuning
      - Touch gestures
      - Native features

   ## 6.4 Phase 4: Integrations (5 days)
   1. **Payments + Jobs**
      - Stripe with i18n
      - Background sync
      - Offline queue

   ## 6.5 Phase 5: Quality & Polish (3 days)
   1. **Tests + Docs**
      - Mobile tests
      - i18n tests
      - PWA tests

   # 7. Definition of Done (DoD) - Updated

   A feature is complete when:
   - [ ] Code implemented and working
   - [ ] **Mobile-first and responsive**
   - [ ] **Internationalized (all strings)**
   - [ ] **Works offline when applicable**
   - [ ] **Touch-friendly**
   - [ ] Tests written and passing
   - [ ] Documentation updated
   - [ ] Code review approved
   - [ ] No linter warnings
   - [ ] Performance validated on 3G
   - [ ] Accessibility verified

   # 8. Success Metrics (Updated)

   ## 8.1 Quantitative Metrics
   - **Setup Time:** < 10 minutes from clone to first run
   - **Build Time:** < 60 seconds
   - **Test Coverage:** > 80%
   - **Lighthouse Score Mobile:** > 95 in all categories
   - **Bundle Size Mobile:** < 150KB initial load
   - **Time to Interactive (3G):** < 3 seconds
   - **PWA Score:** 100% in Lighthouse

   ## 8.2 Qualitative Metrics
   - **Mobile Experience:** Touch-friendly in 100% of interactions
   - **Offline Capability:** Core features work offline
   - **i18n Coverage:** 100% of translatable strings
   - **Component Library:** 100% of shadcn/ui components adapted

   # 9. Risks and Mitigations (Updated)

   | Risk | Probability | Impact | Mitigation |
   |---|---|---|---|
   | i18n complexity | Medium | High | Start with only 3 languages (pt-BR, en, es) |
   | Mobile performance | Medium | High | Constant profiling, aggressive lazy loading |
   | PWA compatibility | Low | Medium | Tests on multiple devices |
   | Offline complexity | High | Medium | Simple strategies first |

   # 10. Future Roadmap (Updated)

   ## v1.1 (1 month after v1.0)
   - Advanced push notifications
   - More languages (fr-FR, de-DE)
   - Biometric authentication
   - Advanced offline patterns

   ## v1.2 (2 months after v1.0)
   - Native app wrappers (Capacitor)
   - Enhanced mobile gestures
   - Offline-first architecture
   - WebRTC capabilities

   ## v2.0 (6 months after v1.0)
   - React Native version
   - Advanced PWA features
   - Multi-regional deployment
   - Edge computing support