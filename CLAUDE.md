# [MASTER GUIDELINES] Development Guide for the DS Club

## 1\. Role and Project Context

**Your Role:** You are a senior full-stack developer, specializing in Next.js,
TypeScript, and building mobile-first Progressive Web Apps (PWAs).

**Project Context:** This is the **DS Club**, a production-ready SaaS starter
kit. Its core pillars are: mobile-first PWA, internationalization (i18n),
multi-tenancy with RLS, and type-safe full-stack development with tRPC.

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

## 3\. 🚨 CRITICAL DATABASE SAFETY RULES 🚨

**THESE RULES ARE NON-NEGOTIABLE AND MUST BE FOLLOWED AT ALL TIMES:**

### ❌ FORBIDDEN DATABASE COMMANDS - NEVER USE:

- `prisma db push --accept-data-loss` - **DESTROYS DATA PERMANENTLY**
- `prisma db push` on databases with existing data - **HIGH RISK OF DATA LOSS**
- `DROP TABLE` or `TRUNCATE` commands without explicit user approval
- Any SQL command that modifies or deletes data without backup

### ✅ SAFE DATABASE PRACTICES - ALWAYS USE:

- `prisma migrate dev` - For development schema changes
- `prisma migrate deploy` - For production deployments
- `prisma migrate diff` - To preview changes before applying
- `prisma db pull` - To sync schema from database (READ-ONLY)

### 📋 MANDATORY PROCEDURES:

1. **ALWAYS** create a backup before schema changes:

   ```bash
   pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **ALWAYS** use migrations for schema changes:

   ```bash
   pnpm prisma migrate dev --name describe_your_change
   ```

3. **NEVER** use `db push` on databases with production data

4. **ALWAYS** verify migration safety with:
   ```bash
   pnpm prisma migrate diff --from-migrations --to-schema-datamodel
   ```

### 🛡️ DATA PROTECTION CHECKLIST:

- [ ] Is this a development environment with disposable data?
- [ ] Have I created a backup before making changes?
- [ ] Am I using the correct migration command?
- [ ] Have I reviewed the migration SQL before applying?

**VIOLATION OF THESE RULES WILL RESULT IN IMMEDIATE CESSATION OF WORK UNTIL DATA
RECOVERY IS COMPLETED.**

## 4\. Essential Commands

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

- `pnpm db:push`: Push the schema to a local, ephemeral DB only (safe to drop).
  Never use on shared/dev/staging/prod or any database with existing data.
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

## 5\. Architecture and Directory Structure

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

## 6\. Fundamental Development Rules

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

## 7\. Specific Patterns and Solutions (Consolidated Learnings)

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

### Analytics System Architecture & Data Flow

- **Database Structure:** The analytics system is based on `orders` and
  `order_items` tables, NOT the `payments` table. This is critical for correct
  data calculations.

  ```sql
  -- Correct data flow:
  orders (1) → order_items (N) → product_language_versions → products
  -- orders.status = 'COMPLETED' indicates successful purchases
  -- order_items.price contains the monetary value
  -- orders.gateway contains payment gateway info
  ```

- **Revenue Calculations:** Always use `order_items.price` as the source of
  truth for revenue calculations. Convert currencies to BRL using fixed rates:

  ```typescript
  const convertToBRL = (amount: number, currency: string): number => {
    const rates = { USD: 5.5, EUR: 6.0, BRL: 1.0 }
    return amount * (rates[currency] || rates['USD'] || 1.0)
  }
  ```

- **Order Status Filtering:** Only include orders with `status = 'COMPLETED'` in
  analytics calculations. Other statuses (PENDING, CANCELLED, etc.) should be
  excluded.

- **Analytics Query Patterns:**

  ```typescript
  // ✅ Correct: Start from orders, join order_items
  const orders = await ctx.db.order.findMany({
    where: { status: 'COMPLETED' },
    include: { orderItems: { include: { productVersion: true } } }
  })

  // ❌ Incorrect: Starting from payments table
  const payments = await ctx.db.payment.findMany({ ... })
  ```

- **Subscription Detection:** Identify subscriptions using
  `order_items.pricing_type = 'subscription'` and the existence of related
  `subscriptions` records.

- **Product Filtering:** Use `product_language_versions.product_code` for
  product-based filters, not product IDs.

- **Currency Handling:** Orders can have different currencies (USD, EUR, BRL).
  Always convert to BRL for consistent reporting using the conversion rates
  above.

- **Time Series Queries:** Use `orders.created_at` for time-based grouping, not
  payment dates. Apply timezone conversion in SQL queries:

  ```sql
  DATE(orders.created_at AT TIME ZONE 'UTC' AT TIME ZONE ${tz}) as day
  ```

- **Key Metrics Definitions:**
  - **Pedidos (Orders):** Count of distinct `orders.id` with status COMPLETED
  - **Receita Bruta:** Sum of `order_items.price` converted to BRL
  - **Ticket Médio:** Receita Bruta ÷ Pedidos
  - **MRR:** Sum of subscription order items' prices in the period
  - **Pagamentos:** Count of `order_items` (not actual payment records)

- **Data Integrity:** Always validate that related records exist:
  ```sql
  WHERE orders.status = 'COMPLETED'
    AND order_items.price IS NOT NULL
    AND product_language_versions.product_code IS NOT NULL
  ```

## 8\. Git Workflow and Versioning

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

### Commit Message Format (CRITICAL)

When creating commits manually with `git commit -m`, you MUST follow this exact
format to pass commitlint validation:

1. **Type**: Must be one of: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`,
   `test`, `build`, `ci`, `chore`, `revert`, `wip`
2. **Scope**: Must be one of: `app`, `components`, `hooks`, `lib`, `server`,
   `api`, `mobile`, `pwa`, `offline`, `touch`, `responsive`, `config`, `deps`,
   `scripts`, `types`, `lint`, `format`, `auth`, `db`, `ui`, `i18n`, `cache`,
   `analytics`, `build`, `deploy`, `test`, `docs`, `dx`
3. **Subject**:
   - Use sentence-case (first letter capitalized)
   - Maximum 72 characters
   - No period at the end
4. **Body**:
   - Each line maximum 100 characters
   - Use bullet points for multiple items
   - Separate from subject with blank line

**Examples:**

```bash
# ✅ CORRECT - Single scope
git commit -m "fix(auth): Fix timing attack vulnerability in delete-auth-user route"

# ✅ CORRECT - With body
git commit -m "feat(components): Add new dashboard widget

- Implement real-time data updates
- Add responsive design for mobile
- Include error handling"

# ❌ INCORRECT - Multiple scopes
git commit -m "fix(security,perf): Address vulnerabilities"  # Use single scope

# ❌ INCORRECT - Wrong scope
git commit -m "fix(security): Fix auth issue"  # 'security' is not a valid scope

# ❌ INCORRECT - Body line too long
git commit -m "fix(lib): Update function

This is a very long line that exceeds 100 characters and will fail validation because it's too long"
```

**Best Practice:** Always use `pnpm commit` for interactive commit creation to
avoid format errors.

## 9\. Definition of Done

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

## 10\. [CRITICAL WORKFLOW] Task Completion Process

Upon completing any task, you **MUST** follow these steps without exception:

1.  **Update the Original Task File:** Check off all acceptance criteria with
    `[x]`, add an implementation summary, and document any key learnings.
2.  **Move the Task File:** Move the completed task's file from the `tasks/`
    directory to the `tasks/completed/` directory.
3.  **Update This `CLAUDE.md`:** If the task resulted in a new, reusable pattern
    or a rule that all developers should follow, add it to
    `Section 6: Specific Patterns and Solutions`.

## 11\. Configuration and Environment Variables

- **Type-Safe Validation:** This project uses `@t3-oss/env-nextjs` to validate
  and provide type-safe access to environment variables.
- **Definition:** Define all environment variables in `src/env.js`. Follow the
  existing Zod schema to add new variables.
- **Usage:** Import the `env` object from `src/env.js` in your code to access
  variables safely. Do not use `process.env` directly in client-side components.
