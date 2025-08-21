import { test, expect } from '@playwright/test'

test('resilience-reload', async ({ page }) => {
  // Login as provider
  await page.goto('/provider/login')
  await page.fill('input[type="email"]', 'provider@demo.test')
  await page.fill('input[type="password"]', 'demo123')
  await page.click('button:has-text("Sign In")')
  
  // Wait for dashboard to load
  await expect(page.locator('text=Encounters')).toBeVisible()
  
  // Select first encounter
  await page.locator('.card').first().click()
  
  // Wait for encounter details to load
  await expect(page.locator('text=Patient Waiting Room')).toBeVisible()
  
  // Click join call button
  await page.click('button:has-text("Join Call")')
  
  // Verify media canvas is displayed
  await expect(page.locator('text=Join Call')).toBeVisible()
  
  // Reload the page
  await page.reload()
  
  // Wait for dashboard to reload and verify we're still logged in
  await expect(page.locator('text=Encounters')).toBeVisible()
  
  // Verify the encounter is still selected
  await expect(page.locator('text=Patient Waiting Room')).toBeVisible()
  
  // Verify we're still in media mode
  await expect(page.locator('text=Join Call')).toBeVisible()
})
