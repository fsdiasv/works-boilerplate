import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: process.env.CI !== undefined && process.env.CI !== 'false',
  retries: process.env.CI !== undefined && process.env.CI !== 'false' ? 2 : 0,
  workers: process.env.CI !== undefined && process.env.CI !== 'false' ? 1 : 2,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !(process.env.CI !== undefined && process.env.CI !== 'false'),
  },
})
