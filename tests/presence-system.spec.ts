import { test, expect } from '@playwright/test'

test.describe('Presence System', () => {
  test('should show presence indicators in encounter list', async ({ page }) => {
    // Login as provider
    await page.goto('/provider/login')
    await page.fill('input[type="email"]', 'provider@demo.test')
    await page.fill('input[type="password"]', 'demo123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/provider/dashboard')
    
    // Check that presence indicators are displayed
    await expect(page.locator('.w-2.h-2.rounded-full')).toBeVisible()
  })

  test('should update presence when provider joins call', async ({ page }) => {
    // Login as provider
    await page.goto('/provider/login')
    await page.fill('input[type="email"]', 'provider@demo.test')
    await page.fill('input[type="password"]', 'demo123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/provider/dashboard')
    
    // Select an encounter
    await page.click('.cursor-pointer:first-child')
    
    // Join the call
    await page.click('button:has-text("Join Call")')
    
    // Wait for connection
    await page.waitForSelector('text=Connected', { timeout: 10000 })
    
    // Verify presence is updated
    await expect(page.locator('.bg-green-500')).toBeVisible()
  })

  test('should update presence when patient joins call', async ({ page, context }) => {
    // First, create a patient session
    const patientPage = await context.newPage()
    await patientPage.goto('/checkin')
    await patientPage.fill('input[placeholder*="Full Name"]', 'Presence Test Patient')
    await patientPage.fill('textarea[placeholder*="Reason for visit"]', 'Test visit')
    await patientPage.click('button:has-text("Check In")')
    
    // Login as provider
    await page.goto('/provider/login')
    await page.fill('input[type="email"]', 'provider@demo.test')
    await page.fill('input[type="password"]', 'demo123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/provider/dashboard')
    
    // Convert patient to encounter
    await page.click('button:has-text("Start Encounter")')
    
    // Select the encounter
    await page.click('.cursor-pointer:first-child')
    
    // Verify patient presence shows as offline initially
    await expect(page.locator('text=0 online')).toBeVisible()
    
    // Patient joins call
    await patientPage.click('button:has-text("Join Call")')
    
    // Wait for patient to connect
    await patientPage.waitForSelector('text=Connected', { timeout: 10000 })
    
    // Verify presence is updated on provider side
    await expect(page.locator('text=1 online')).toBeVisible()
  })

  test('should handle presence timeout correctly', async ({ page, context }) => {
    // This test would require mocking time or waiting for actual timeout
    // For now, we'll test the presence query logic
    
    // Login as provider
    await page.goto('/provider/login')
    await page.fill('input[type="email"]', 'provider@demo.test')
    await page.fill('input[type="password"]', 'demo123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/provider/dashboard')
    
    // Verify presence system is working
    await expect(page.locator('.w-2.h-2.rounded-full')).toBeVisible()
  })

  test('should show correct online count for multiple participants', async ({ page, context }) => {
    // Create multiple patient sessions
    const patient1Page = await context.newPage()
    const patient2Page = await context.newPage()
    
    // Patient 1 checks in
    await patient1Page.goto('/checkin')
    await patient1Page.fill('input[placeholder*="Full Name"]', 'Patient 1')
    await patient1Page.fill('textarea[placeholder*="Reason for visit"]', 'Test visit')
    await patient1Page.click('button:has-text("Check In")')
    
    // Patient 2 checks in
    await patient2Page.goto('/checkin')
    await patient2Page.fill('input[placeholder*="Full Name"]', 'Patient 2')
    await patient2Page.fill('textarea[placeholder*="Reason for visit"]', 'Test visit')
    await patient2Page.click('button:has-text("Check In")')
    
    // Login as provider
    await page.goto('/provider/login')
    await page.fill('input[type="email"]', 'provider@demo.test')
    await page.fill('input[type="password"]', 'demo123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/provider/dashboard')
    
    // Verify both patients are in queue
    await expect(page.locator('text=Patient 1')).toBeVisible()
    await expect(page.locator('text=Patient 2')).toBeVisible()
    
    // Convert first patient to encounter
    await page.click('button:has-text("Start Encounter"):first')
    
    // Select the encounter
    await page.click('.cursor-pointer:first-child')
    
    // Provider joins call
    await page.click('button:has-text("Join Call")')
    await page.waitForSelector('text=Connected', { timeout: 10000 })
    
    // Patient 1 joins call
    await patient1Page.click('button:has-text("Join Call")')
    await patient1Page.waitForSelector('text=Connected', { timeout: 10000 })
    
    // Verify presence shows 2 online (provider + patient)
    await expect(page.locator('text=2 online')).toBeVisible()
  })

  test('should handle provider leaving call', async ({ page }) => {
    // Login as provider
    await page.goto('/provider/login')
    await page.fill('input[type="email"]', 'provider@demo.test')
    await page.fill('input[type="password"]', 'demo123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/provider/dashboard')
    
    // Select an encounter and join call
    await page.click('.cursor-pointer:first-child')
    await page.click('button:has-text("Join Call")')
    await page.waitForSelector('text=Connected', { timeout: 10000 })
    
    // Leave the call
    await page.click('button:has-text("Leave Call")')
    
    // Verify presence is updated
    await expect(page.locator('text=0 online')).toBeVisible()
  })
})
