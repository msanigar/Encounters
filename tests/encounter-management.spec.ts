import { test, expect } from '@playwright/test'

test.describe('Encounter Management', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to provider dashboard
    await page.goto('/provider/login')
    await page.fill('input[type="email"]', 'provider@demo.test')
    await page.fill('input[type="password"]', 'demo123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/provider/dashboard')
  })

  test('should schedule a new encounter with existing patient', async ({ page }) => {
    // Select a patient
    await page.click('text=Select Patient')
    await page.click('text=John Doe') // Assuming this patient exists
    
    // Fill in encounter details
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dateString = tomorrow.toISOString().split('T')[0]
    const timeString = '14:00'
    
    await page.fill('input[type="date"]', dateString)
    await page.fill('input[type="time"]', timeString)
    await page.selectOption('select[name="channel"]', 'email')
    
    // Schedule the encounter
    await page.click('button:has-text("Schedule Encounter")')
    
    // Verify success message
    await expect(page.locator('text=Encounter scheduled successfully')).toBeVisible()
  })

  test('should create a new patient and schedule encounter', async ({ page }) => {
    // Click "Create New Patient"
    await page.click('text=Create New Patient')
    
    // Fill in patient details
    await page.fill('input[name="displayName"]', 'Jane Smith')
    await page.fill('input[name="emailOrPhone"]', 'jane.smith@example.com')
    await page.click('button:has-text("Create Patient")')
    
    // Verify patient is selected
    await expect(page.locator('text=Jane Smith')).toBeVisible()
    
    // Schedule encounter
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dateString = tomorrow.toISOString().split('T')[0]
    
    await page.fill('input[type="date"]', dateString)
    await page.fill('input[type="time"]', '15:00')
    await page.selectOption('select[name="channel"]', 'link')
    await page.click('button:has-text("Schedule Encounter")')
    
    // Verify success
    await expect(page.locator('text=Encounter scheduled successfully')).toBeVisible()
  })

  test('should reschedule an encounter from calendar', async ({ page }) => {
    // Navigate to calendar
    await page.goto('/provider/calendar')
    
    // Find and click on an encounter
    await page.click('.bg-green-100:first-child')
    
    // Click reschedule button
    await page.click('button:has-text("Reschedule")')
    
    // Set new date/time
    const newDate = new Date()
    newDate.setDate(newDate.getDate() + 2)
    const newDateString = newDate.toISOString().split('T')[0]
    
    await page.fill('input[type="datetime-local"]', `${newDateString}T16:00`)
    await page.click('button:has-text("Reschedule")')
    
    // Verify success
    await expect(page.locator('text=Encounter rescheduled successfully')).toBeVisible()
  })

  test('should delete an encounter from calendar', async ({ page }) => {
    // Navigate to calendar
    await page.goto('/provider/calendar')
    
    // Find and hover over an encounter to reveal delete button
    const encounter = page.locator('.bg-green-100:first-child')
    await encounter.hover()
    
    // Click delete button
    await page.click('.text-red-600') // Trash icon
    
    // Confirm deletion
    await page.click('button:has-text("Delete")')
    
    // Verify encounter is removed
    await expect(encounter).not.toBeVisible()
  })

  test('should show schedule encounter section only when patient is selected', async ({ page }) => {
    // Initially, schedule section should not be visible
    await expect(page.locator('text=Please select a patient above to schedule an encounter')).not.toBeVisible()
    
    // Select a patient
    await page.click('text=Select Patient')
    await page.click('text=John Doe')
    
    // Now schedule section should be visible
    await expect(page.locator('text=Schedule Encounter')).toBeVisible()
  })

  test('should handle form assignment correctly', async ({ page }) => {
    // Select a patient and schedule encounter
    await page.click('text=Select Patient')
    await page.click('text=John Doe')
    
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dateString = tomorrow.toISOString().split('T')[0]
    
    await page.fill('input[type="date"]', dateString)
    await page.fill('input[type="time"]', '10:00')
    await page.selectOption('select[name="channel"]', 'link')
    await page.click('button:has-text("Schedule Encounter")')
    
    // Navigate to the encounter
    await page.click('text=View Encounter')
    
    // Assign intake form
    await page.click('button:has-text("Assign Intake Form")')
    
    // Verify form is assigned
    await expect(page.locator('text=Intake Form Assigned')).toBeVisible()
  })
})
