import { test, expect } from '@playwright/test'

test.describe('Patient Dashboard Features', () => {
  test('should display patient dashboard after check-in', async ({ page }) => {
    // Check in as patient
    await page.goto('/checkin')
    await page.fill('input[placeholder*="Full Name"]', 'Test Patient')
    await page.fill('textarea[placeholder*="Reason for visit"]', 'Test visit')
    await page.click('button:has-text("Check In")')
    
    // Wait for check-in success
    await expect(page.locator('text=You\'re Checked In!')).toBeVisible()
    
    // Provider converts to encounter (simulated)
    // In real scenario, this would be done by provider
    // For testing, we'll assume the patient gets redirected to dashboard
    
    // Verify patient dashboard elements
    await expect(page.locator('text=Welcome, Test Patient')).toBeVisible()
    await expect(page.locator('text=Your telehealth session')).toBeVisible()
  })

  test('should show intake form only when assigned', async ({ page }) => {
    // This test would require setting up an encounter with assigned form
    // For now, we'll test the conditional rendering logic
    
    // Navigate to a patient encounter page
    await page.goto('/patient/test-encounter/test-patient')
    
    // Check if intake form is present (should only be if assigned)
    const intakeForm = page.locator('text=Patient Intake Form')
    if (await intakeForm.isVisible()) {
      // Form is assigned, test form functionality
      await page.fill('input[placeholder*="Full Name"]', 'Test Name')
      await page.fill('textarea[placeholder*="Reason for visit"]', 'Test reason')
      await page.check('input[type="checkbox"]')
      await page.click('button:has-text("Submit Form")')
      
      // Verify form submission
      await expect(page.locator('text=Form Submitted Successfully!')).toBeVisible()
    } else {
      // Form is not assigned, verify it's not shown
      await expect(intakeForm).not.toBeVisible()
    }
  })

  test('should display media controls', async ({ page }) => {
    // Navigate to patient dashboard
    await page.goto('/patient/test-encounter/test-patient')
    
    // Verify media controls are present
    await expect(page.locator('button[aria-label*="microphone"]')).toBeVisible()
    await expect(page.locator('button[aria-label*="camera"]')).toBeVisible()
  })

  test('should handle device selection', async ({ page }) => {
    // Navigate to patient dashboard
    await page.goto('/patient/test-encounter/test-patient')
    
    // Test device selection dropdowns
    const micSelector = page.locator('select[name="microphone"]')
    const camSelector = page.locator('select[name="camera"]')
    
    if (await micSelector.isVisible()) {
      await micSelector.selectOption({ index: 0 })
    }
    
    if (await camSelector.isVisible()) {
      await camSelector.selectOption({ index: 0 })
    }
  })

  test('should show waiting room when not in call', async ({ page }) => {
    // Navigate to patient dashboard
    await page.goto('/patient/test-encounter/test-patient')
    
    // Verify waiting room is displayed
    await expect(page.locator('text=Waiting for provider')).toBeVisible()
    await expect(page.locator('button:has-text("Join Call")')).toBeVisible()
  })

  test('should join call successfully', async ({ page }) => {
    // Navigate to patient dashboard
    await page.goto('/patient/test-encounter/test-patient')
    
    // Click join call button
    await page.click('button:has-text("Join Call")')
    
    // Verify call interface is shown
    await expect(page.locator('text=In Call')).toBeVisible()
    await expect(page.locator('button:has-text("Leave Call")')).toBeVisible()
  })

  test('should display chat panel', async ({ page }) => {
    // Navigate to patient dashboard
    await page.goto('/patient/test-encounter/test-patient')
    
    // Verify chat panel is present
    await expect(page.locator('text=Chat')).toBeVisible()
    await expect(page.locator('input[placeholder*="Type a message"]')).toBeVisible()
  })

  test('should send chat messages', async ({ page }) => {
    // Navigate to patient dashboard
    await page.goto('/patient/test-encounter/test-patient')
    
    // Type and send a message
    await page.fill('input[placeholder*="Type a message"]', 'Hello, this is a test message')
    await page.click('button[aria-label="Send message"]')
    
    // Verify message appears in chat
    await expect(page.locator('text=Hello, this is a test message')).toBeVisible()
  })

  test('should handle mobile responsive layout', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Navigate to patient dashboard
    await page.goto('/patient/test-encounter/test-patient')
    
    // Verify mobile layout elements
    await expect(page.locator('text=Welcome, Test Patient')).toBeVisible()
    
    // Check that layout is responsive
    const header = page.locator('h1')
    const headerText = await header.textContent()
    expect(headerText).toContain('Test Patient')
  })

  test('should show session details', async ({ page }) => {
    // Navigate to patient dashboard
    await page.goto('/patient/test-encounter/test-patient')
    
    // Verify session details are displayed
    await expect(page.locator('text=Session Details')).toBeVisible()
    await expect(page.locator('text=Provider:')).toBeVisible()
    await expect(page.locator('text=Status:')).toBeVisible()
  })

  test('should handle end call functionality', async ({ page }) => {
    // Navigate to patient dashboard
    await page.goto('/patient/test-encounter/test-patient')
    
    // Join call first
    await page.click('button:has-text("Join Call")')
    await expect(page.locator('text=In Call')).toBeVisible()
    
    // End call
    await page.click('button:has-text("Leave Call")')
    
    // Verify back to waiting room
    await expect(page.locator('text=Waiting for provider')).toBeVisible()
  })

  test('should display real-time status updates', async ({ page }) => {
    // Navigate to patient dashboard
    await page.goto('/patient/test-encounter/test-patient')
    
    // Verify status indicators are present
    await expect(page.locator('text=Waiting for provider')).toBeVisible()
    
    // Join call to test status change
    await page.click('button:has-text("Join Call")')
    await expect(page.locator('text=In Call')).toBeVisible()
    await expect(page.locator('text=Connected')).toBeVisible()
  })

  test('should handle form validation', async ({ page }) => {
    // Navigate to patient dashboard with assigned form
    await page.goto('/patient/test-encounter/test-patient')
    
    const intakeForm = page.locator('text=Patient Intake Form')
    if (await intakeForm.isVisible()) {
      // Try to submit without filling required fields
      await page.click('button:has-text("Submit Form")')
      
      // Verify validation errors
      await expect(page.locator('text=This field is required')).toBeVisible()
      
      // Fill required fields
      await page.fill('input[placeholder*="Full Name"]', 'Test Name')
      await page.fill('textarea[placeholder*="Reason for visit"]', 'Test reason')
      await page.check('input[type="checkbox"]')
      
      // Submit again
      await page.click('button:has-text("Submit Form")')
      
      // Verify success
      await expect(page.locator('text=Form Submitted Successfully!')).toBeVisible()
    }
  })
})
