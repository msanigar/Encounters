import { test, expect } from '@playwright/test'

test('pause-and-workflow', async ({ page }) => {
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
  
  // End call to pause
  await page.click('button:has-text("End Call")')
  
  // Verify we're back in workflow mode
  await expect(page.locator('text=Patient Waiting Room')).toBeVisible()
  
  // Assign a form
  await page.click('button:has-text("Assign")')
  
  // Verify form assignment is reflected
  await expect(page.locator('text=Form assigned')).toBeVisible()
  
  // Re-join call
  await page.click('button:has-text("Join Call")')
  
  // Verify we're back in media mode
  await expect(page.locator('text=Join Call')).toBeVisible()
})
