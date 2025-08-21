import { test, expect } from '@playwright/test'

test('prejoin-observability', async ({ page }) => {
  // Navigate to patient check-in page
  await page.goto('/demo-room/test-oit-123')
  
  // Fill in patient name
  await page.fill('input[placeholder="Enter your full name"]', 'John Doe')
  
  // Submit check-in
  await page.click('button:has-text("Check In")')
  
  // Wait for check-in completion
  await expect(page.locator('text=Check-in Complete!')).toBeVisible()
  
  // Verify patient name is displayed
  await expect(page.locator('text=John Doe')).toBeVisible()
  
  // Verify status shows waiting for provider
  await expect(page.locator('text=Waiting for provider')).toBeVisible()
})

test('provider-dashboard-observability', async ({ page }) => {
  // Login as provider
  await page.goto('/provider/login')
  await page.fill('input[type="email"]', 'provider@demo.test')
  await page.fill('input[type="password"]', 'demo123')
  await page.click('button:has-text("Sign In")')
  
  // Wait for dashboard to load
  await expect(page.locator('text=Encounters')).toBeVisible()
  
  // Check that encounters list is populated
  await expect(page.locator('.card')).toHaveCount(3)
  
  // Verify patient names are visible
  await expect(page.locator('text=john.doe@example.com')).toBeVisible()
  await expect(page.locator('text=jane.smith@example.com')).toBeVisible()
  await expect(page.locator('text=bob.wilson@example.com')).toBeVisible()
})
