import { test, expect } from '@playwright/test'

test.describe('Demo Page UI', () => {
  test('should match the screenshot', async ({ page }) => {
    await page.goto('/demo')
    await expect(page).toHaveScreenshot('demo-page.png', { fullPage: true })
  })
})
