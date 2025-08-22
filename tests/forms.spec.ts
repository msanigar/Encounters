import { test, expect } from '@playwright/test'

test.describe('Forms & Workflows', () => {
  test('should display intake form for patients', async ({ page }) => {
    // Navigate to patient dashboard (you'll need a valid encounter URL)
    await page.goto('/patient/test-encounter/test-patient')
    
    // Wait for page to load
    await page.waitForSelector('h1:has-text("Welcome")', { timeout: 10000 })
    
    // Verify intake form is visible (if not in call)
    await expect(page.locator('text=Patient Intake Form')).toBeVisible()
    await expect(page.locator('input[placeholder*="Full Name"]')).toBeVisible()
    await expect(page.locator('textarea[placeholder*="Reason for visit"]')).toBeVisible()
  })

  test('should submit intake form', async ({ page }) => {
    // Navigate to patient dashboard
    await page.goto('/patient/test-encounter/test-patient')
    await page.waitForSelector('h1:has-text("Welcome")', { timeout: 10000 })
    
    // Fill out intake form
    await page.fill('input[placeholder*="Full Name"]', 'Test Patient')
    await page.fill('textarea[placeholder*="Reason for visit"]', 'Annual checkup')
    
    // Check consent checkbox
    await page.check('input[type="checkbox"]')
    
    // Submit form
    await page.click('button:has-text("Submit Form")')
    
    // Verify form was submitted
    await expect(page.locator('text=Form Submitted Successfully!')).toBeVisible()
  })

  test('should validate required fields', async ({ page }) => {
    // Navigate to patient dashboard
    await page.goto('/patient/test-encounter/test-patient')
    await page.waitForSelector('h1:has-text("Welcome")', { timeout: 10000 })
    
    // Try to submit without filling required fields
    await page.click('button:has-text("Submit Form")')
    
    // Verify validation errors
    await expect(page.locator('text=Name is required')).toBeVisible()
    await expect(page.locator('text=Reason for visit is required')).toBeVisible()
    await expect(page.locator('text=Consent to treat is required')).toBeVisible()
  })
})
