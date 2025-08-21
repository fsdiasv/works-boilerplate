import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: process.env.CI !== undefined && process.env.CI !== 'false',
  retries: process.env.CI !== undefined && process.env.CI !== 'false' ? 2 : 0,
  workers: process.env.CI !== undefined && process.env.CI !== 'false' ? 1 : 2,
  reporter: ['html', 'json', 'junit'],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retry-with-video',
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },
  projects: [
    // Desktop browsers
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
      },
    },
    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        viewport: { width: 1280, height: 720 },
      },
    },
    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'],
        viewport: { width: 1280, height: 720 },
      },
    },

    // Mobile devices - Primary focus for mobile-first PWA
    {
      name: 'Mobile Chrome',
      use: { 
        ...devices['Pixel 5'],
        isMobile: true,
        hasTouch: true,
        deviceScaleFactor: 3,
      },
    },
    {
      name: 'Mobile Safari',
      use: { 
        ...devices['iPhone 12'],
        isMobile: true,
        hasTouch: true,
        deviceScaleFactor: 3,
      },
    },
    {
      name: 'Samsung Galaxy',
      use: { 
        ...devices['Galaxy S8'],
        isMobile: true,
        hasTouch: true,
        deviceScaleFactor: 3,
      },
    },

    // Tablet devices
    {
      name: 'iPad',
      use: { 
        ...devices['iPad Pro'],
        isMobile: true,
        hasTouch: true,
      },
    },

    // PWA-specific testing
    {
      name: 'PWA Chrome',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 390, height: 844 }, // Mobile viewport on desktop for PWA testing
        contextOptions: {
          // PWA-specific options
          permissions: ['notifications', 'geolocation'],
        },
      },
    },

    // Slow network testing for offline functionality
    {
      name: 'Mobile Slow 3G',
      use: { 
        ...devices['Pixel 5'],
        isMobile: true,
        hasTouch: true,
        contextOptions: {
          offline: false,
        },
        launchOptions: {
          slowMo: 100,
        },
      },
    },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !(process.env.CI !== undefined && process.env.CI !== 'false'),
    timeout: 120 * 1000,
  },
})
