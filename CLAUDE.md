# [MASTER GUIDELINES] Development Guide for the Works Boilerplate

## 1\. Role and Project Context

**Your Role:** You are a senior full-stack developer, specializing in Next.js,
TypeScript, and building mobile-first Progressive Web Apps (PWAs).

**Project Context:** This is the **Works Boilerplate**, a production-ready SaaS
starter kit. Its core pillars are: mobile-first PWA, internationalization
(i18n), multi-tenancy with RLS, and type-safe full-stack development with tRPC.

## 2\. Core Technology Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript (strict mode)
- **Styling**: Tailwind CSS v4, shadcn/ui
- **Backend**: tRPC on Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL (Supabase)
- **Authentication**: Supabase Auth (JWT)
- **i18n**: `next-intl`
- **PWA**: `next-pwa` with Workbox
- **Testing**: Vitest, Playwright, React Testing Library
- **Package Manager**: `pnpm` (use `pnpm` commands exclusively)

### Quality & Workflow Tooling

- **Git Hooks:** `Husky` for managing Git hooks.
- **Pre-commit Checks:** `lint-staged` to run linters on staged files.
- **Commit Formatting:** `Commitizen` (`git-cz`) for creating standardized
  commits.
- **Dependency Validation:** `Knip` to detect unused dependencies and files.
- **Environment Variables:** `@t3-oss/env-nextjs` for type-safe environment
  variables.

## 3\. Essential Commands

### Development

- `pnpm dev`: Start the development server.
- `pnpm build`: Build the application for production.
- `pnpm start`: Start the production server.
- `pnpm analyze`: Analyze the production bundle size.
- `pnpm clean`: Remove build artifacts and caches.

### Code Quality

- `pnpm validate`: **(Primary)** Run all checks (TypeScript, ESLint, Prettier).
- `pnpm format`: Format all code with Prettier.
- `pnpm lint`: Run ESLint.
- `pnpm lint:fix`: Attempt to auto-fix ESLint errors.
- `pnpm typecheck`: Run the TypeScript compiler to check for type errors.
- `pnpm check:deps`: Validate for unused dependencies with `Knip`.

### Internationalization (i18n)

- `pnpm i18n:validate`: Validate the consistency of translation files.

### Database (Prisma)

- `pnpm db:push`: Push the schema to the DB (development).
- `pnpm db:migrate`: Create and apply a new migration (development).
- `pnpm db:migrate:deploy`: Apply pending migrations (production).
- `pnpm db:studio`: Open the Prisma Studio UI.
- `pnpm db:seed`: Seed the database with test data.
- `pnpm db:generate`: (Re)generate the Prisma client.

### Testing

- `pnpm test`: Run unit tests with Vitest.
- `pnpm test:ui`: Run unit tests with the Vitest UI.
- `pnpm test:coverage`: Generate a test coverage report.
- `pnpm test:e2e`: Run end-to-end tests with Playwright.

## 4\. Architecture and Directory Structure

```
src/
├── app/[locale]/         # Internationalized routes
│   ├── (auth)/           # Auth pages (login, signup, etc.)
│   ├── (dashboard)/      # Protected dashboard routes
│   └── (marketing)/      # Public marketing pages
├── components/
│   ├── ui/               # shadcn/ui components
│   ├── mobile/           # Mobile-specific components
│   └── shared/           # Shared components
├── server/               # Backend code (tRPC, Prisma)
│   ├── api/              # tRPC routers
│   └── db/               # Database client
└── lib/                  # Utilities and helpers
```

## 5\. Fundamental Development Rules

### General Principles

- **Mobile-First ALWAYS:** Develop and validate in a mobile viewport first.
- **Zero Hardcoded Strings:** ALL user-facing strings MUST use `next-intl`.
- **TypeScript Strict Mode:** No `any` types are allowed. Adhere strictly to the
  `tsconfig.json` rules.
- **Security by Default:** All inputs are validated with Zod (client and
  server). Data access is protected by RLS.
- **Offline-First:** Critical features must work offline via the Service Worker.

### UI & Components

- **Server Components by Default:** Use Server Components. Only adopt
  `"use client"` when interactivity is essential.
- **Touch Targets:** All interactive elements MUST have a minimum touch target
  area of **44x44px**.
- **Component Variants:** Use the `class-variance-authority` (CVA) library to
  create components with type-safe style variants. Combine it with `clsx` and
  `tailwind-merge`.
- **User Notifications (Toasts):** Use the `Sonner` library to display all
  user-facing notifications.
- **Theme Management (Dark Mode):** Theme switching is handled by `next-themes`.
  Use its providers and hooks.
- **Forms:** Build all forms with `react-hook-form`. Use `Zod` for schema
  validation, integrated via `@hookform/resolvers`.
- **Icons:** Use the `lucide-react` library for all icons.
- **Animations:** Implement animations using `framer-motion`.
- **SVG Imports:** SVGs can be imported directly as React components, thanks to
  the `@svgr/webpack` configuration.
- **In-Code Documentation:** Explain the "why" of complex logic using **TSDoc**
  formatted comments.

## 6\. Specific Patterns and Solutions (Consolidated Learnings)

### Tailwind CSS v4 & shadcn/ui

- **PostCSS Configuration:** Tailwind v4 requires the `@tailwindcss/postcss`
  plugin. Your `postcss.config.mjs` must be:
  ```js
  export default {
    plugins: {
      '@tailwindcss/postcss': {},
      autoprefixer: {},
    },
  }
  ```
- **Global CSS Syntax:** Use `@import 'tailwindcss';` and define custom colors
  inside a `@theme` block in `globals.css`.
  ```css
  @theme {
    --color-primary: hsl(221.2 83.2% 53.3%);
    /* ... other colors ... */
  }
  ```

### Internationalization (i18n)

- **Currency Formatting (ICU):** Use the `{value, number, ::currency/CODE}`
  syntax. The currency code (e.g., `BRL`, `USD`) is mandatory.
  - ✅ **Correct:** `{total, number, ::currency/BRL}`
  - ❌ **Incorrect:** `R$ {total}`
- **Locale-Aware Navigation:** ALWAYS use the Next.js `<Link>` component. All
  `hrefs` must be prefixed with the current locale (e.g.,
  `href={\`/${locale}/dashboard\`}`). Get the `locale`from the`useLocale()\`
  hook.

### Performance & Bundle Optimization

- **Heavy Components:** Use dynamic imports (`next/dynamic`) for components that
  are not critical for the initial render (e.g., charts, complex editors). This
  is mandatory for libraries like `recharts`.
  ```tsx
  import dynamic from 'next/dynamic'
  const VisitorsChart = dynamic(() => import('./VisitorsChart'), { ssr: false })
  ```

### Authentication (Supabase)

- **Session Management:** Use cookie-based sessions with SSR support. The
  Supabase client is configured differently for server, client, and middleware
  contexts.
- **Auth Context:** All auth operations go through `useAuth()` hook from
  `/src/contexts/auth-context.tsx`. This provides consistent error handling and
  toast notifications.
- **Protected Routes:** Middleware automatically handles auth checks. Define
  protected routes in the `protectedRoutes` array in `/src/middleware.ts`.
- **OAuth Providers:** Support for Google, GitHub, and Apple. Configure redirect
  URLs in Supabase dashboard as `{SITE_URL}/auth/callback`.
- **TypeScript Strict Mode:** Handle nullable auth values explicitly:
  ```tsx
  // ✅ Correct
  if (token !== undefined && token !== '') { ... }
  // ❌ Incorrect
  if (token) { ... }
  ```

## 7\. Git Workflow and Versioning

- **Creating Commits:** **DO NOT use `git commit` directly.** All commits MUST
  be created using the `pnpm commit` command. This will launch `Commitizen` to
  guide you through creating a standardized Conventional Commit message.
- **Automated Hooks:** `Husky` is configured to run `lint-staged` before each
  commit. This automatically runs `pnpm validate` on your modified files,
  ensuring code quality before it is committed.
- **Auto-Formatting:** The `prettier-plugin-tailwindcss` is installed. It will
  automatically sort your Tailwind CSS classes on save. Do not manually reorder
  classes.
- **Attribution:** **(Critical Reinforcement)** NEVER include "Co-authored-by"
  or any AI attribution in commit messages. `pnpm commit` ensures a clean,
  professional format.

## 8\. Definition of Done

A task is only considered complete when ALL of the following criteria are met:

- [ ] Mobile-first and fully responsive.
- [ ] All strings are internationalized via `next-intl`.
- [ ] Interactions are touch-friendly (44x44px minimum).
- [ ] Critical features work offline.
- [ ] Fully type-safe from the database to the UI.
- [ ] Zod validation is implemented on all inputs.
- [ ] Tests are written and passing (\>80% coverage).
- [ ] Performance is validated on a slow 3G network (Lighthouse \>95).
- [ ] Accessibility is verified (WCAG 2.1 AA).
- [ ] Security review is completed.
- [ ] Code review is approved.
- [ ] No TypeScript errors or ESLint warnings (`pnpm validate` passes).

## 9\. [CRITICAL WORKFLOW] Task Completion Process

Upon completing any task, you **MUST** follow these steps without exception:

1.  **Update the Original Task File:** Check off all acceptance criteria with
    `[x]`, add an implementation summary, and document any key learnings.
2.  **Move the Task File:** Move the completed task's file from the `tasks/`
    directory to the `tasks/completed/` directory.
3.  **Update This `CLAUDE.md`:** If the task resulted in a new, reusable pattern
    or a rule that all developers should follow, add it to
    `Section 6: Specific Patterns and Solutions`.

## 10\. Configuration and Environment Variables

- **Type-Safe Validation:** This project uses `@t3-oss/env-nextjs` to validate
  and provide type-safe access to environment variables.
- **Definition:** Define all environment variables in `src/env.js`. Follow the
  existing Zod schema to add new variables.
- **Usage:** Import the `env` object from `src/env.js` in your code to access
  variables safely. Do not use `process.env` directly in client-side components.
