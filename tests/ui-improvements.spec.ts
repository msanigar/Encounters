import { test, expect } from '@playwright/test'

test.describe('UI Improvements', () => {
  test.beforeEach(async ({ page }) => {
    // Login as provider
    await page.goto('/provider/login')
    await page.fill('input[type="email"]', 'provider@demo.test')
    await page.fill('input[type="password"]', 'demo123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/provider/dashboard')
  })

  test('should not show schedule encounter section when no patient selected', async ({ page }) => {
    // Initially, schedule section should not be visible
    await expect(page.locator('text=Please select a patient above to schedule an encounter')).not.toBeVisible()
    await expect(page.locator('text=Schedule Encounter')).not.toBeVisible()
  })

  test('should show schedule encounter section when patient is selected', async ({ page }) => {
    // Select a patient
    await page.click('text=Select Patient')
    await page.click('text=John Doe') // Assuming this patient exists
    
    // Now schedule section should be visible
    await expect(page.locator('text=Schedule Encounter')).toBeVisible()
  })

  test('should not show Quick Actions section', async ({ page }) => {
    // Verify Quick Actions section is removed
    await expect(page.locator('text=Quick Actions')).not.toBeVisible()
    await expect(page.locator('text=View Calendar')).not.toBeVisible()
    await expect(page.locator('text=Review Past Encounters')).not.toBeVisible()
    await expect(page.locator('text=Reset OITs')).not.toBeVisible()
  })

  test('should show combined queue management section', async ({ page }) => {
    // Verify queue management is combined into one section
    await expect(page.locator('text=Walk-in Queue')).toBeVisible()
    
    // Check that both stats and patient list are in the same card
    await expect(page.locator('text=Waiting')).toBeVisible()
    await expect(page.locator('text=In Progress')).toBeVisible()
    await expect(page.locator('text=Current Patients')).toBeVisible()
  })

  test('should show check-in link in separate section', async ({ page }) => {
    // Verify check-in link is in its own section
    await expect(page.locator('text=Walk-in Check-in')).toBeVisible()
    await expect(page.locator('text=/checkin')).toBeVisible()
    await expect(page.locator('button:has-text("Copy")')).toBeVisible()
  })

  test('should display calendar link in encounter list header', async ({ page }) => {
    // Verify calendar link is in the encounter list header
    await expect(page.locator('text=Today\'s Encounters')).toBeVisible()
    await expect(page.locator('button:has-text("View Calendar")')).toBeVisible()
  })

  test('should show presence indicators in encounter list', async ({ page }) => {
    // Verify presence indicators are displayed
    await expect(page.locator('.w-2.h-2.rounded-full')).toBeVisible()
    await expect(page.locator('text=online')).toBeVisible()
  })

  test('should handle patient selection workflow', async ({ page }) => {
    // Test the complete patient selection workflow
    
    // Initially no patient selected
    await expect(page.locator('text=Schedule Encounter')).not.toBeVisible()
    
    // Select a patient
    await page.click('text=Select Patient')
    await page.click('text=John Doe')
    
    // Schedule section should appear
    await expect(page.locator('text=Schedule Encounter')).toBeVisible()
    
    // Deselect patient (if possible)
    // This depends on the UI implementation
  })

  test('should display queue stats correctly', async ({ page }) => {
    // Verify queue stats are displayed in the combined section
    await expect(page.locator('text=Waiting')).toBeVisible()
    await expect(page.locator('text=In Progress')).toBeVisible()
    await expect(page.locator('text=Completed Today')).toBeVisible()
    await expect(page.locator('text=Avg Wait')).toBeVisible()
    
    // Verify stats are in a styled container
    await expect(page.locator('.bg-gray-50.rounded-lg')).toBeVisible()
  })

  test('should show patient list in queue section', async ({ page }) => {
    // Verify patient list is shown under "Current Patients"
    await expect(page.locator('text=Current Patients')).toBeVisible()
    
    // Check for either patients or empty state
    const hasPatients = await page.locator('text=No patients in queue').isVisible()
    const hasPatientList = await page.locator('.bg-gray-50.rounded-lg').isVisible()
    
    // Should show either patients or empty state
    expect(hasPatients || hasPatientList).toBeTruthy()
  })

  test('should handle responsive layout', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Verify layout is responsive
    await expect(page.locator('text=Today\'s Encounters')).toBeVisible()
    await expect(page.locator('text=Walk-in Queue')).toBeVisible()
    
    // Check that elements are properly stacked on mobile
    const queueSection = page.locator('text=Walk-in Queue').first()
    await expect(queueSection).toBeVisible()
  })

  test('should maintain functionality after UI changes', async ({ page }) => {
    // Verify core functionality still works after UI improvements
    
    // Patient selection
    await page.click('text=Select Patient')
    await expect(page.locator('text=Schedule Encounter')).toBeVisible()
    
    // Queue management
    await expect(page.locator('text=Walk-in Queue')).toBeVisible()
    
    // Calendar navigation
    await page.click('button:has-text("View Calendar")')
    await page.waitForURL('/provider/calendar')
    await expect(page.locator('text=Calendar')).toBeVisible()
  })

  test('should show proper loading states', async ({ page }) => {
    // Verify loading states are properly handled
    
    // Check for loading indicators in queue stats
    const loadingElements = page.locator('.animate-pulse')
    if (await loadingElements.count() > 0) {
      await expect(loadingElements.first()).toBeVisible()
    }
  })

  test('should handle empty states gracefully', async ({ page }) => {
    // Verify empty states are handled properly
    
    // Check for empty queue state
    const emptyQueue = page.locator('text=No patients in queue')
    if (await emptyQueue.isVisible()) {
      await expect(page.locator('text=Walk-in patients will appear here')).toBeVisible()
    }
    
    // Check for empty encounter list
    const emptyEncounters = page.locator('text=No encounters yet')
    if (await emptyEncounters.isVisible()) {
      await expect(page.locator('text=Schedule your first patient encounter')).toBeVisible()
    }
  })
})
