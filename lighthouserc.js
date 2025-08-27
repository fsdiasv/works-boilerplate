module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:3000/',
        'http://localhost:3000/en/auth/login',
        'http://localhost:3000/en/auth/signup',
        'http://localhost:3000/en/auth/forgot-password',
      ],
      startServerCommand: 'pnpm start',
      startServerReadyPattern: 'Ready',
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.85 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],
        'categories:pwa': ['warn', { minScore: 0.8 }],
        // Core Web Vitals
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 4000 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        // PWA requirements
        'service-worker': 'error',
        'installable-manifest': 'error',
        'apple-touch-icon': 'error',
        'themed-omnibox': 'off', // Optional for PWA
        // Mobile-first
        viewport: 'error',
        'tap-targets': 'error',
        // Security
        'is-on-https': 'off', // Skip for localhost
        'uses-https': 'off', // Skip for localhost
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
}
