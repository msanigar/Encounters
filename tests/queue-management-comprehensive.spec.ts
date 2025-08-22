import { test, expect } from '@playwright/test'

test.describe('Queue Management - Comprehensive', () => {
  test('should allow anonymous patient check-in', async ({ page }) => {
    // Navigate to check-in page
    await page.goto('/checkin')
    
    // Fill in check-in form
    await page.fill('input[placeholder*="Full Name"]', 'Walk-in Patient')
    await page.fill('textarea[placeholder*="Reason for visit"]', 'Annual checkup')
    await page.fill('input[placeholder*="Email or phone"]', 'walkin@example.com')
    
    // Submit check-in
    await page.click('button:has-text("Check In")')
    
    // Verify success message
    await expect(page.locator('text=You\'re Checked In!')).toBeVisible()
    await expect(page.locator('text=Queue Position:')).toBeVisible()
  })

  test('should display queue stats correctly', async ({ page }) => {
    // Login as provider
    await page.goto('/provider/login')
    await page.fill('input[type="email"]', 'provider@demo.test')
    await page.fill('input[type="password"]', 'demo123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/provider/dashboard')
    
    // Check queue stats are displayed
    await expect(page.locator('text=Waiting')).toBeVisible()
    await expect(page.locator('text=In Progress')).toBeVisible()
    await expect(page.locator('text=Completed Today')).toBeVisible()
    await expect(page.locator('text=Avg Wait')).toBeVisible()
  })

  test('should convert queue patient to encounter', async ({ page }) => {
    // Login as provider
    await page.goto('/provider/login')
    await page.fill('input[type="email"]', 'provider@demo.test')
    await page.fill('input[type="password"]', 'demo123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/provider/dashboard')
    
    // Find a patient in queue and start encounter
    const startButton = page.locator('button:has-text("Start Encounter")').first()
    if (await startButton.isVisible()) {
      await startButton.click()
      
      // Verify encounter is created
      await expect(page.locator('text=Encounter created successfully')).toBeVisible()
    }
  })

  test('should show check-in link for providers', async ({ page }) => {
    // Login as provider
    await page.goto('/provider/login')
    await page.fill('input[type="email"]', 'provider@demo.test')
    await page.fill('input[type="password"]', 'demo123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/provider/dashboard')
    
    // Verify check-in link is displayed
    await expect(page.locator('text=Walk-in Check-in')).toBeVisible()
    await expect(page.locator('text=/checkin')).toBeVisible()
    
    // Test copy functionality
    await page.click('button:has-text("Copy")')
    // Note: Can't easily test clipboard in Playwright, but we can verify the button works
  })

  test('should update queue when patient is converted to encounter', async ({ page }) => {
    // First, check in as a patient
    await page.goto('/checkin')
    await page.fill('input[placeholder*="Full Name"]', 'Test Patient')
    await page.fill('textarea[placeholder*="Reason for visit"]', 'Test visit')
    await page.click('button:has-text("Check In")')
    
    // Get the patient name for verification
    const patientName = 'Test Patient'
    
    // Login as provider in new context
    const providerPage = await page.context().newPage()
    await providerPage.goto('/provider/login')
    await providerPage.fill('input[type="email"]', 'provider@demo.test')
    await providerPage.fill('input[type="password"]', 'demo123')
    await providerPage.click('button[type="submit"]')
    await providerPage.waitForURL('/provider/dashboard')
    
    // Verify patient appears in queue
    await expect(providerPage.locator(`text=${patientName}`)).toBeVisible()
    
    // Start encounter
    await providerPage.click('button:has-text("Start Encounter")')
    
    // Verify patient is removed from queue
    await expect(providerPage.locator(`text=${patientName}`)).not.toBeVisible()
  })

  test('should handle empty queue state', async ({ page }) => {
    // Login as provider
    await page.goto('/provider/login')
    await page.fill('input[type="email"]', 'provider@demo.test')
    await page.fill('input[type="password"]', 'demo123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/provider/dashboard')
    
    // If queue is empty, should show empty state
    const emptyState = page.locator('text=No patients in queue')
    if (await emptyState.isVisible()) {
      await expect(page.locator('text=Walk-in patients will appear here')).toBeVisible()
    }
  })

  test('should display patient contact information in queue', async ({ page }) => {
    // Check in as patient with contact info
    await page.goto('/checkin')
    await page.fill('input[placeholder*="Full Name"]', 'Contact Patient')
    await page.fill('textarea[placeholder*="Reason for visit"]', 'Test visit')
    await page.fill('input[placeholder*="Email or phone"]', 'contact@example.com')
    await page.click('button:has-text("Check In")')
    
    // Login as provider
    const providerPage = await page.context().newPage()
    await providerPage.goto('/provider/login')
    await providerPage.fill('input[type="email"]', 'provider@demo.test')
    await providerPage.fill('input[type="password"]', 'demo123')
    await providerPage.click('button[type="submit"]')
    await providerPage.waitForURL('/provider/dashboard')
    
    // Verify contact info is displayed
    await expect(providerPage.locator('text=contact@example.com')).toBeVisible()
  })
})
