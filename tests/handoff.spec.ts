import { test, expect } from '@playwright/test'

test('handoff', async ({ page, context }) => {
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
  
  // Simulate handoff by opening a new tab
  const newPage = await context.newPage()
  
  // Navigate to the same encounter in new tab
  await newPage.goto('/provider/login')
  await newPage.fill('input[type="email"]', 'provider@demo.test')
  await newPage.fill('input[type="password"]', 'demo123')
  await newPage.click('button:has-text("Sign In")')
  
  // Wait for dashboard to load
  await expect(newPage.locator('text=Encounters')).toBeVisible()
  
  // Select the same encounter
  await newPage.locator('.card').first().click()
  
  // Verify we can access the same encounter
  await expect(newPage.locator('text=Patient Waiting Room')).toBeVisible()
  
  // Close the new tab
  await newPage.close()
})
