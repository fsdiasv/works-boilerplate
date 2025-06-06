# Developer Environment Setup Guide

This guide will help you set up a comprehensive development environment for the
Works Boilerplate project with a focus on mobile-first development.

## Prerequisites

- Node.js 18+ (recommend using Node 20+)
- pnpm 9.0+ (package manager)
- Git
- VS Code (recommended IDE)

## Quick Setup

1. **Clone and Install**

   ```bash
   git clone <repository-url>
   cd works-boilerplate
   pnpm install
   ```

2. **Verify Setup**

   ```bash
   pnpm validate  # Runs TypeScript check, linting, and format check
   ```

3. **Start Development**
   ```bash
   pnpm dev  # Starts Next.js development server with Turbopack
   ```

## Development Tools Overview

### Code Quality Stack

- **ESLint**: Comprehensive linting with TypeScript, React, and accessibility
  rules
- **Prettier**: Consistent code formatting with mobile-first preferences
- **Husky**: Git hooks for automated quality checks
- **lint-staged**: Run checks only on staged files for faster commits
- **Commitlint**: Enforce conventional commit messages

### Mobile-First Development Features

#### 🎯 Touch Target Validation

Pre-commit hooks automatically check for proper touch targets:

- Minimum 44x44px for interactive elements
- Accessibility compliance validation
- Mobile-specific linting rules

#### 📱 Mobile Testing Configuration

- VS Code debugging profiles for mobile viewports
- Chrome DevTools integration with mobile user agents
- Responsive design validation

### Available Scripts

```bash
# Development
pnpm dev              # Start development server
pnpm build            # Production build
pnpm start            # Start production server

# Code Quality
pnpm typecheck        # TypeScript type checking
pnpm lint             # ESLint checking
pnpm lint:fix         # Auto-fix ESLint issues
pnpm format           # Format all files with Prettier
pnpm format:check     # Check formatting without changes
pnpm validate         # Run all quality checks

# Mobile-Specific
pnpm mobile:validate  # Mobile compliance checks
pnpm analyze          # Bundle analysis with mobile focus

# Git Workflow
pnpm pre-commit       # Manual pre-commit checks
pnpm commit           # Interactive commit with commitizen

# Testing
pnpm test             # Unit tests with Vitest
pnpm test:ui          # Tests with UI
pnpm test:e2e         # End-to-end tests with Playwright

# Database
pnpm db:push          # Push schema changes
pnpm db:studio        # Open Prisma Studio
```

## VS Code Setup

### Required Extensions

The workspace will automatically suggest essential extensions:

**Core Development:**

- TypeScript and JavaScript Language Features
- ESLint
- Prettier
- Tailwind CSS IntelliSense

**Mobile Development:**

- Chrome Debugger for mobile testing
- React Native Tools
- Edge DevTools

**Quality & Productivity:**

- GitLens for Git integration
- Todo Tree for task management
- Error Lens for inline diagnostics
- Accessibility Linter

### Workspace Configuration

The project includes optimized VS Code settings for:

- Auto-formatting on save
- ESLint auto-fixing
- Tailwind CSS class suggestions
- Mobile debugging configurations
- File nesting for better organization

## Git Workflow

### Commit Message Convention

We use conventional commits with these types:

- `feat`: New features
- `fix`: Bug fixes
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Test additions/changes
- `build`: Build system changes
- `ci`: CI configuration changes
- `chore`: Maintenance tasks

**Scopes include:** `mobile`, `pwa`, `ui`, `api`, `auth`, `db`, etc.

### Pre-commit Checks

Every commit automatically runs:

1. **Lint-staged**: Format and lint only changed files
2. **TypeScript**: Full project type checking
3. **Mobile Validation**: Touch target and accessibility checks
4. **Commit Message**: Conventional commit format validation

### Example Workflow

```bash
# Make your changes
git add .

# Commit with interactive prompt (optional)
pnpm commit

# Or commit normally (hooks will run automatically)
git commit -m "feat(mobile): add touch-optimized navigation component"
```

## Mobile-First Development Guidelines

### Touch Targets

- Minimum 44x44px for all interactive elements
- Use `min-h-[44px] min-w-[44px]` for small buttons
- Ensure adequate spacing between touch targets

### Responsive Design

- Start with mobile layout (320px viewport)
- Use Tailwind's mobile-first breakpoints
- Test on real devices when possible

### Performance

- Monitor bundle size with `pnpm analyze`
- Target <150KB initial bundle for mobile
- Use `next/image` for all images
- Implement lazy loading for non-critical components

### Accessibility

- Use semantic HTML elements
- Include proper ARIA labels
- Ensure keyboard navigation works
- Test with screen readers

## Debugging Mobile Issues

### VS Code Mobile Debugging

1. Start the dev server: `pnpm dev`
2. Use "Debug: Mobile Chrome" configuration
3. Opens Chrome with mobile user agent and viewport

### Chrome DevTools

- Toggle device simulation (Ctrl+Shift+M)
- Test different network conditions
- Use Lighthouse for performance audits

### Real Device Testing

- Use your local IP address: `http://192.168.x.x:3000`
- Enable mobile hotspot for testing
- Use browser developer tools on mobile devices

## Troubleshooting

### Common Issues

**ESLint/Prettier Conflicts:**

```bash
pnpm lint:fix  # Fix ESLint issues
pnpm format    # Format with Prettier
```

**TypeScript Errors:**

```bash
pnpm typecheck  # Check types without building
```

**Git Hook Issues:**

```bash
chmod +x .husky/pre-commit .husky/commit-msg  # Fix permissions
```

**Node Modules Issues:**

```bash
pnpm clean     # Clean build artifacts
rm -rf node_modules
pnpm install   # Reinstall dependencies
```

### Performance Issues

- Use `pnpm analyze` to check bundle size
- Monitor Core Web Vitals in development
- Test on slow 3G networks

## IDE Alternatives

While VS Code is recommended, the project works with:

- **WebStorm**: Has built-in support for most tools
- **Vim/Neovim**: Use appropriate language server plugins
- **Sublime Text**: Install ESLint and Prettier packages

## Next Steps

1. Review the [Project Documentation](../README.md)
2. Check out the [Mobile Development Guidelines](./MOBILE_GUIDELINES.md)
3. Read the [Component Architecture Guide](./COMPONENT_ARCHITECTURE.md)
4. Explore the [Testing Strategy](./TESTING_STRATEGY.md)

## Getting Help

- Check the project's issue tracker
- Review existing documentation
- Ask questions in team channels
- Pair with experienced team members

---

Remember: This project prioritizes mobile-first development. Every feature
should work perfectly on mobile devices before considering desktop enhancements.
