import { test, expect } from '@playwright/test'

test.describe('Encounter Scheduling', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/provider/dashboard')
  })

  test('should schedule a new encounter with email invite', async ({ page }) => {
    // Wait for dashboard to load
    await page.waitForSelector('h1:has-text("Provider Dashboard")', { timeout: 10000 })
    
    // First create/select a patient
    await page.click('input[placeholder*="Search patients"]')
    const patientName = `Test Patient ${Date.now()}`
    await page.fill('input[placeholder*="Search patients"]', patientName)
    await page.click('button:has-text("Create New Patient")')
    await page.fill('input[placeholder*="Full name"]', patientName)
    await page.fill('input[placeholder*="Email or phone"]', `test${Date.now()}@example.com`)
    await page.click('button:has-text("Create Patient")')
    
    // Wait for patient to be selected
    await expect(page.locator('text=' + patientName)).toBeVisible()
    
    // Schedule encounter
    await page.waitForSelector('[data-testid="schedule-encounter"]', { timeout: 5000 })
    
    // Set scheduled time (15 minutes from now)
    const futureTime = new Date()
    futureTime.setMinutes(futureTime.getMinutes() + 15)
    const timeString = futureTime.toISOString().slice(0, 16)
    await page.fill('input[type="datetime-local"]', timeString)
    
    // Select email channel
    await page.click('button:has-text("Email")')
    
    // Submit scheduling
    await page.click('button:has-text("Schedule Encounter")')
    
    // Verify encounter was scheduled
    await expect(page.locator('text=Encounter Scheduled!')).toBeVisible()
    await expect(page.locator('text=Invite email sent')).toBeVisible()
  })

  test('should schedule encounter with link-only invite', async ({ page }) => {
    // Create patient first
    await page.click('input[placeholder*="Search patients"]')
    const patientName = `Link Patient ${Date.now()}`
    await page.fill('input[placeholder*="Search patients"]', patientName)
    await page.click('button:has-text("Create New Patient")')
    await page.fill('input[placeholder*="Full name"]', patientName)
    await page.fill('input[placeholder*="Email or phone"]', `link${Date.now()}@example.com`)
    await page.click('button:has-text("Create Patient")')
    
    // Schedule with link only
    await page.click('button:has-text("Link Only")')
    await page.click('button:has-text("Schedule Encounter")')
    
    // Verify link is generated
    await expect(page.locator('text=Encounter Scheduled!')).toBeVisible()
    await expect(page.locator('button:has-text("Copy Link")')).toBeVisible()
  })
})
