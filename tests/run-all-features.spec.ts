import { test, expect } from '@playwright/test'

test.describe('Complete Feature Test Suite', () => {
  test('Complete workflow: Patient check-in to encounter completion', async ({ page, context }) => {
    // Step 1: Patient checks in
    const patientPage = await context.newPage()
    await patientPage.goto('/checkin')
    await patientPage.fill('input[placeholder*="Full Name"]', 'E2E Test Patient')
    await patientPage.fill('textarea[placeholder*="Reason for visit"]', 'Complete workflow test')
    await patientPage.fill('input[placeholder*="Email or phone"]', 'e2e@test.com')
    await patientPage.click('button:has-text("Check In")')
    
    await expect(patientPage.locator('text=You\'re Checked In!')).toBeVisible()
    
    // Step 2: Provider logs in and sees patient in queue
    await page.goto('/provider/login')
    await page.fill('input[type="email"]', 'provider@demo.test')
    await page.fill('input[type="password"]', 'demo123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/provider/dashboard')
    
    await expect(page.locator('text=E2E Test Patient')).toBeVisible()
    
    // Step 3: Provider converts patient to encounter
    await page.click('button:has-text("Start Encounter"):first')
    await expect(page.locator('text=Encounter created successfully')).toBeVisible()
    
    // Step 4: Provider schedules another encounter with existing patient
    await page.click('text=Select Patient')
    await page.click('text=John Doe') // Assuming this patient exists
    
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dateString = tomorrow.toISOString().split('T')[0]
    
    await page.fill('input[type="date"]', dateString)
    await page.fill('input[type="time"]', '14:00')
    await page.selectOption('select[name="channel"]', 'email')
    await page.click('button:has-text("Schedule Encounter")')
    
    await expect(page.locator('text=Encounter scheduled successfully')).toBeVisible()
    
    // Step 5: Navigate to calendar and test rescheduling
    await page.click('button:has-text("View Calendar")')
    await page.waitForURL('/provider/calendar')
    
    const encounter = page.locator('.bg-green-100:first-child')
    if (await encounter.isVisible()) {
      await encounter.click()
      
      const newDate = new Date()
      newDate.setDate(newDate.getDate() + 2)
      const newDateString = newDate.toISOString().split('T')[0]
      
      await page.fill('input[type="datetime-local"]', `${newDateString}T15:00`)
      await page.click('button:has-text("Reschedule")')
      
      await expect(page.locator('text=Reschedule Encounter')).not.toBeVisible()
    }
    
    // Step 6: Test presence system
    await page.goto('/provider/dashboard')
    await page.click('.cursor-pointer:first-child')
    await page.click('button:has-text("Join Call")')
    
    await page.waitForSelector('text=Connected', { timeout: 10000 })
    await expect(page.locator('.bg-green-500')).toBeVisible()
    
    // Step 7: Patient joins call
    await patientPage.click('button:has-text("Join Call")')
    await patientPage.waitForSelector('text=Connected', { timeout: 10000 })
    
    // Step 8: Test chat functionality
    await page.fill('input[placeholder*="Type a message"]', 'Hello from provider')
    await page.click('button[aria-label="Send message"]')
    
    await patientPage.fill('input[placeholder*="Type a message"]', 'Hello from patient')
    await patientPage.click('button[aria-label="Send message"]')
    
    await expect(page.locator('text=Hello from patient')).toBeVisible()
    await expect(patientPage.locator('text=Hello from provider')).toBeVisible()
    
    // Step 9: End call
    await page.click('button:has-text("Leave Call")')
    await patientPage.click('button:has-text("Leave Call")')
    
    // Step 10: Verify presence updates
    await expect(page.locator('text=0 online')).toBeVisible()
  })

  test('Complete patient management workflow', async ({ page }) => {
    // Login as provider
    await page.goto('/provider/login')
    await page.fill('input[type="email"]', 'provider@demo.test')
    await page.fill('input[type="password"]', 'demo123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/provider/dashboard')
    
    // Create new patient
    await page.click('text=Create New Patient')
    await page.fill('input[name="displayName"]', 'New Test Patient')
    await page.fill('input[name="emailOrPhone"]', 'newpatient@test.com')
    await page.click('button:has-text("Create Patient")')
    
    await expect(page.locator('text=New Test Patient')).toBeVisible()
    
    // Schedule encounter for new patient
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dateString = tomorrow.toISOString().split('T')[0]
    
    await page.fill('input[type="date"]', dateString)
    await page.fill('input[type="time"]', '16:00')
    await page.selectOption('select[name="channel"]', 'link')
    await page.click('button:has-text("Schedule Encounter")')
    
    await expect(page.locator('text=Encounter scheduled successfully')).toBeVisible()
    
    // Navigate to encounter and assign form
    await page.click('text=View Encounter')
    await page.click('button:has-text("Assign Intake Form")')
    await expect(page.locator('text=Intake Form Assigned')).toBeVisible()
  })

  test('Complete queue management workflow', async ({ page, context }) => {
    // Create multiple patients checking in
    const patient1Page = await context.newPage()
    const patient2Page = await context.newPage()
    
    // Patient 1 checks in
    await patient1Page.goto('/checkin')
    await patient1Page.fill('input[placeholder*="Full Name"]', 'Queue Patient 1')
    await patient1Page.fill('textarea[placeholder*="Reason for visit"]', 'Queue test 1')
    await patient1Page.click('button:has-text("Check In")')
    
    // Patient 2 checks in
    await patient2Page.goto('/checkin')
    await patient2Page.fill('input[placeholder*="Full Name"]', 'Queue Patient 2')
    await patient2Page.fill('textarea[placeholder*="Reason for visit"]', 'Queue test 2')
    await patient2Page.click('button:has-text("Check In")')
    
    // Provider logs in
    await page.goto('/provider/login')
    await page.fill('input[type="email"]', 'provider@demo.test')
    await page.fill('input[type="password"]', 'demo123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/provider/dashboard')
    
    // Verify both patients in queue
    await expect(page.locator('text=Queue Patient 1')).toBeVisible()
    await expect(page.locator('text=Queue Patient 2')).toBeVisible()
    
    // Convert first patient to encounter
    await page.click('button:has-text("Start Encounter"):first')
    await expect(page.locator('text=Encounter created successfully')).toBeVisible()
    
    // Verify second patient still in queue
    await expect(page.locator('text=Queue Patient 2')).toBeVisible()
    await expect(page.locator('text=Queue Patient 1')).not.toBeVisible()
  })

  test('Complete calendar management workflow', async ({ page }) => {
    // Login as provider
    await page.goto('/provider/login')
    await page.fill('input[type="email"]', 'provider@demo.test')
    await page.fill('input[type="password"]', 'demo123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/provider/dashboard')
    
    // Navigate to calendar
    await page.click('button:has-text("View Calendar")')
    await page.waitForURL('/provider/calendar')
    
    // Test navigation
    const currentMonth = await page.locator('h2').textContent()
    await page.click('button:has-text("Next")')
    const nextMonth = await page.locator('h2').textContent()
    expect(nextMonth).not.toBe(currentMonth)
    
    await page.click('button:has-text("Previous")')
    const backToCurrent = await page.locator('h2').textContent()
    expect(backToCurrent).toBe(currentMonth)
    
    // Test encounter management
    const encounter = page.locator('.bg-green-100:first-child')
    if (await encounter.isVisible()) {
      // Test rescheduling
      await encounter.click()
      const newDate = new Date()
      newDate.setDate(newDate.getDate() + 3)
      const newDateString = newDate.toISOString().split('T')[0]
      
      await page.fill('input[type="datetime-local"]', `${newDateString}T17:00`)
      await page.click('button:has-text("Reschedule")')
      
      // Test deletion
      await encounter.hover()
      await page.click('.text-red-600')
      await page.click('button:has-text("Delete")')
      
      await expect(encounter).not.toBeVisible()
    }
  })
})
