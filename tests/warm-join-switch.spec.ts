import { test, expect } from '@playwright/test'

test('warm-join-switch', async ({ page }) => {
  // Login as provider
  await page.goto('/provider/login')
  await page.fill('input[type="email"]', 'provider@demo.test')
  await page.fill('input[type="password"]', 'demo123')
  await page.click('button:has-text("Sign In")')
  
  // Wait for dashboard to load
  await expect(page.locator('text=Encounters')).toBeVisible()
  
  // Select first encounter
  const firstEncounter = page.locator('.card').first()
  await firstEncounter.click()
  
  // Wait for encounter details to load
  await expect(page.locator('text=Patient Waiting Room')).toBeVisible()
  
  // Click join call button
  await page.click('button:has-text("Join Call")')
  
  // Verify media canvas is displayed
  await expect(page.locator('text=Join Call')).toBeVisible()
  
  // Switch to second encounter
  const secondEncounter = page.locator('.card').nth(1)
  await secondEncounter.click()
  
  // Verify we're back in workflow mode
  await expect(page.locator('text=Patient Waiting Room')).toBeVisible()
  
  // Switch back to first encounter
  await firstEncounter.click()
  
  // Verify we're still in media mode (warm switch)
  await expect(page.locator('text=Join Call')).toBeVisible()
})
