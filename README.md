# Works Boilerplate

A mobile-first, production-ready SaaS starter kit built with Next.js 15, React
19, and TypeScript.

## 🚀 Features

- **Mobile-First PWA** with offline capabilities
- **Internationalization** (English, Spanish, Portuguese)
- **Multi-tenancy** with workspace-based data isolation
- **Type-safe** full-stack development with tRPC
- **Security-first** approach with authentication and RLS

## 🛠 Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS v4, shadcn/ui components
- **Backend**: tRPC, Prisma ORM
- **Database**: PostgreSQL (Supabase)
- **Auth**: Supabase Auth (JWT-based)
- **i18n**: next-intl
- **PWA**: next-pwa with Workbox

## 🏃‍♂️ Quick Start

### For Claude Code Users

If you're using Claude Code with MCP servers:

```bash
# Set up MCP environment
cp .env.mcp.example .env.mcp
# Edit .env.mcp with your API keys

# Start Claude Code with MCP servers
./scripts/claude-start.sh  # Linux/macOS
./scripts/claude-start.ps1 # Windows PowerShell
```

See [MCP Setup Guide](docs/MCP_SETUP.md) for detailed instructions.

### Standard Setup

1. **Clone and install dependencies**

   ```bash
   git clone <repository-url>
   cd works-boilerplate
   pnpm install
   ```

2. **Set up environment variables**

   ```bash
   cp .env.example .env.local
   # Edit .env.local with your values
   ```

3. **Start development server**

   ```bash
   pnpm dev
   ```

4. **Open your browser**
   ```
   http://localhost:3000
   ```

## 📜 Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm lint:fix` - Fix ESLint issues
- `pnpm typecheck` - Run TypeScript checks
- `pnpm analyze` - Analyze bundle size
- `pnpm clean` - Clean build artifacts
- `pnpm check` - Run type checking and linting

## 📁 Project Structure

```
src/
├── app/[locale]/          # Internationalized routes
├── components/
│   ├── ui/               # shadcn/ui components
│   ├── mobile/           # Mobile-specific components
│   └── shared/           # Shared components
├── hooks/                # Custom React hooks
├── lib/                  # Utilities and configs
└── server/               # Backend code (tRPC, DB)
```

## 🔧 Development Guidelines

### Mobile-First Always

- Every feature must work perfectly on mobile before desktop
- Minimum 44x44px touch targets for all interactive elements
- Test on slow 3G networks
- **Current bundle size: 101KB** (32% under 150KB target)

### Code Quality

- TypeScript strict mode with zero `any` types
- All user-facing strings must use i18n
- > 80% test coverage for new code
- ESLint and Prettier compliance
- **Run `pnpm check` before every commit**

### Performance Targets

- Lighthouse score >95 on mobile
- Time to Interactive <3s on 3G
- Initial bundle size <150KB ✅ **Currently: 101KB**
- Monitor with `pnpm analyze` during development

### 🎯 Implementation Learnings

#### Tailwind CSS v4 Setup

```bash
# Required dependencies for Tailwind v4
pnpm add -D @tailwindcss/postcss autoprefixer

# PostCSS config must use '@tailwindcss/postcss' not 'tailwindcss'
```

#### pnpm Configuration

```bash
# Essential .npmrc settings
echo "auto-install-peers=true" >> .npmrc
echo "shamefully-hoist=true" >> .npmrc
```

#### Mobile-First Development

- Use Next.js 15's separate `viewport` export for mobile optimization
- Include PWA meta tags from project start
- Bundle analyzer only runs with `ANALYZE=true` environment variable

## 🚧 Project Status

### ✅ Completed (Phase 1 - Foundation)

- **E1_T1.1**: Next.js 15.3.3 + React 19 + TypeScript setup
- Mobile-first architecture established
- Bundle optimization and analysis tools configured
- Security headers and PWA preparation completed

### 🎯 Next Tasks

- **E1_T1.2**: Build System Configuration
- **E2_T2.1**: Internationalization Setup
- **E3_T3.1**: Enhanced Tailwind Configuration

### 📊 Current Metrics

- **Bundle Size**: 101KB / 150KB target (32% under limit)
- **TypeScript**: Zero errors (strict mode)
- **ESLint**: Zero warnings
- **Build Time**: ~2 seconds
- **Dependencies**: Latest stable versions

## 🛠 Troubleshooting

### Common Issues

#### Tailwind Not Working

```bash
# Ensure correct dependencies are installed
pnpm add -D @tailwindcss/postcss autoprefixer

# Check postcss.config.mjs uses correct plugin
'@tailwindcss/postcss': {}  # Not 'tailwindcss': {}
```

#### TypeScript Errors

```bash
# Run type check to see specific issues
pnpm typecheck

# Common fix: ensure strict mode compliance
# No 'any' types allowed in this project
```

#### Bundle Size Issues

```bash
# Analyze bundle composition
pnpm analyze

# Check what's included in the bundle
# Target: keep under 150KB
```

#### pnpm Installation Issues

```bash
# Clear cache and reinstall
pnpm clean
rm -rf node_modules
pnpm install
```

## 📖 Documentation

- [Product Requirements](./prd.md)
- [Task Breakdown](./tasks/)
- [Development Guidelines](./CLAUDE.md)
- [Setup Implementation Notes](./tasks/E1_T1.1_Next_Project_Setup.md)

## 🤝 Contributing

1. Follow the mobile-first development principles
2. Ensure all strings are internationalized
3. Write tests for new features
4. Run `pnpm check` before committing
5. Monitor bundle size with `pnpm analyze`
6. Maintain TypeScript strict mode compliance

## 📄 License

MIT License - see LICENSE file for details
