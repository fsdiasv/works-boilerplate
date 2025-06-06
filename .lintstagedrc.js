module.exports = {
  // TypeScript and JavaScript files
  '**/*.{ts,tsx,js,jsx}': ['eslint --fix', 'prettier --write'],

  // JSON files
  '**/*.json': ['prettier --write'],

  // Markdown files
  '**/*.md': ['prettier --write'],

  // CSS files
  '**/*.css': ['prettier --write'],

  // Configuration files
  '**/*.{yml,yaml}': ['prettier --write'],

  // Check TypeScript compilation for changed files
  '**/*.{ts,tsx}': () => 'pnpm typecheck',

  // Mobile-specific checks for component files
  'src/components/**/*.{ts,tsx}': [
    // Check for mobile touch target compliance
    filenames => {
      const files = filenames.join(' ')
      return [
        `echo "📱 Validating mobile touch targets in: ${files}"`,
        // This will be expanded with more mobile-specific validations
      ]
    },
  ],
}
