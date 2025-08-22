import { test, expect } from '@playwright/test'

test.describe('Queue Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/provider/dashboard')
  })

  test('should display queue management section', async ({ page }) => {
    // Wait for dashboard to load
    await page.waitForSelector('h1:has-text("Provider Dashboard")', { timeout: 10000 })
    
    // Verify queue management section is visible
    await expect(page.locator('text=Walk-in Queue')).toBeVisible()
    await expect(page.locator('text=Current Queue')).toBeVisible()
  })

  test('should show check-in link for walk-ins', async ({ page }) => {
    // Wait for dashboard to load
    await page.waitForSelector('h1:has-text("Provider Dashboard")', { timeout: 10000 })
    
    // Verify check-in link section
    await expect(page.locator('text=Walk-in Check-in')).toBeVisible()
    await expect(page.locator('text=Share this link')).toBeVisible()
  })

  test('should navigate to check-in page', async ({ page }) => {
    // Navigate to check-in page
    await page.goto('/checkin')
    
    // Verify check-in form is displayed
    await expect(page.locator('h1:has-text("Walk-in Check-in")')).toBeVisible()
    await expect(page.locator('input[placeholder*="Full Name"]')).toBeVisible()
    await expect(page.locator('textarea[placeholder*="Reason for visit"]')).toBeVisible()
  })

  test('should submit check-in form', async ({ page }) => {
    // Navigate to check-in page
    await page.goto('/checkin')
    
    // Fill out check-in form
    const patientName = `Queue Patient ${Date.now()}`
    await page.fill('input[placeholder*="Full Name"]', patientName)
    await page.fill('textarea[placeholder*="Reason for visit"]', 'Follow-up consultation')
    await page.fill('input[placeholder*="Email or phone"]', `queue${Date.now()}@example.com`)
    
    // Submit form
    await page.click('button:has-text("Join Queue")')
    
    // Verify check-in success
    await expect(page.locator('text=You\'re Checked In!')).toBeVisible()
    await expect(page.locator('text=Queue Position:')).toBeVisible()
  })
})
