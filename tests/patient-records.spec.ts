import { test, expect } from '@playwright/test'

test.describe('Patient Records Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/provider/dashboard')
  })

  test('should create a new patient record', async ({ page }) => {
    // Wait for patient selector to load
    await page.waitForSelector('[data-testid="patient-selector"]', { timeout: 10000 })
    
    // Click on patient search input
    await page.click('input[placeholder*="Search patients"]')
    
    // Type a new patient name
    const newPatientName = `Test Patient ${Date.now()}`
    await page.fill('input[placeholder*="Search patients"]', newPatientName)
    
    // Click create new patient button
    await page.click('button:has-text("Create New Patient")')
    
    // Fill in patient details
    await page.fill('input[placeholder*="Full name"]', newPatientName)
    await page.fill('input[placeholder*="Email or phone"]', `test${Date.now()}@example.com`)
    
    // Submit the form
    await page.click('button:has-text("Create Patient")')
    
    // Verify patient was created and selected
    await expect(page.locator('text=' + newPatientName)).toBeVisible()
  })

  test('should search and select existing patients', async ({ page }) => {
    // Wait for patient selector
    await page.waitForSelector('[data-testid="patient-selector"]', { timeout: 10000 })
    
    // Search for existing patient
    await page.click('input[placeholder*="Search patients"]')
    await page.fill('input[placeholder*="Search patients"]', 'john')
    
    // Wait for search results
    await page.waitForSelector('button:has-text("john")', { timeout: 5000 })
    
    // Click on a patient from results
    await page.click('button:has-text("john")')
    
    // Verify patient is selected
    await expect(page.locator('[data-testid="selected-patient"]')).toBeVisible()
  })
})
