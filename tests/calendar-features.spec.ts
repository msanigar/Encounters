import { test, expect } from '@playwright/test'

test.describe('Calendar Features', () => {
  test.beforeEach(async ({ page }) => {
    // Login as provider
    await page.goto('/provider/login')
    await page.fill('input[type="email"]', 'provider@demo.test')
    await page.fill('input[type="password"]', 'demo123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/provider/dashboard')
  })

  test('should navigate to calendar view', async ({ page }) => {
    // Click calendar link
    await page.click('text=View Calendar')
    await page.waitForURL('/provider/calendar')
    
    // Verify calendar is displayed
    await expect(page.locator('text=Calendar')).toBeVisible()
    await expect(page.locator('text=View and manage your scheduled encounters')).toBeVisible()
  })

  test('should navigate between months', async ({ page }) => {
    // Navigate to calendar
    await page.goto('/provider/calendar')
    
    // Get current month name
    const currentMonth = await page.locator('h2').textContent()
    
    // Click next month
    await page.click('button:has-text("Next")')
    
    // Verify month changed
    const nextMonth = await page.locator('h2').textContent()
    expect(nextMonth).not.toBe(currentMonth)
    
    // Click previous month
    await page.click('button:has-text("Previous")')
    
    // Verify back to original month
    const backToCurrent = await page.locator('h2').textContent()
    expect(backToCurrent).toBe(currentMonth)
  })

  test('should display encounters on calendar', async ({ page }) => {
    // Navigate to calendar
    await page.goto('/provider/calendar')
    
    // Check if encounters are displayed
    const encounters = page.locator('.bg-green-100')
    if (await encounters.count() > 0) {
      await expect(encounters.first()).toBeVisible()
    }
  })

  test('should open reschedule modal when clicking encounter', async ({ page }) => {
    // Navigate to calendar
    await page.goto('/provider/calendar')
    
    // Find and click on an encounter
    const encounter = page.locator('.bg-green-100:first-child')
    if (await encounter.isVisible()) {
      await encounter.click()
      
      // Verify reschedule modal opens
      await expect(page.locator('text=Reschedule Encounter')).toBeVisible()
      await expect(page.locator('input[type="datetime-local"]')).toBeVisible()
    }
  })

  test('should reschedule encounter successfully', async ({ page }) => {
    // Navigate to calendar
    await page.goto('/provider/calendar')
    
    // Find and click on an encounter
    const encounter = page.locator('.bg-green-100:first-child')
    if (await encounter.isVisible()) {
      await encounter.click()
      
      // Set new date/time
      const newDate = new Date()
      newDate.setDate(newDate.getDate() + 3)
      const newDateString = newDate.toISOString().split('T')[0]
      
      await page.fill('input[type="datetime-local"]', `${newDateString}T14:00`)
      await page.click('button:has-text("Reschedule")')
      
      // Verify modal closes
      await expect(page.locator('text=Reschedule Encounter')).not.toBeVisible()
    }
  })

  test('should delete encounter from calendar', async ({ page }) => {
    // Navigate to calendar
    await page.goto('/provider/calendar')
    
    // Find and hover over an encounter to reveal delete button
    const encounter = page.locator('.bg-green-100:first-child')
    if (await encounter.isVisible()) {
      await encounter.hover()
      
      // Click delete button (trash icon)
      await page.click('.text-red-600')
      
      // Verify delete confirmation modal
      await expect(page.locator('text=Delete Encounter')).toBeVisible()
      await expect(page.locator('text=This action cannot be undone')).toBeVisible()
      
      // Confirm deletion
      await page.click('button:has-text("Delete")')
      
      // Verify modal closes
      await expect(page.locator('text=Delete Encounter')).not.toBeVisible()
    }
  })

  test('should delete encounter from reschedule modal', async ({ page }) => {
    // Navigate to calendar
    await page.goto('/provider/calendar')
    
    // Find and click on an encounter
    const encounter = page.locator('.bg-green-100:first-child')
    if (await encounter.isVisible()) {
      await encounter.click()
      
      // Click delete button in reschedule modal
      await page.click('button:has-text("Delete")')
      
      // Verify delete confirmation modal
      await expect(page.locator('text=Delete Encounter')).toBeVisible()
      
      // Cancel deletion
      await page.click('button:has-text("Cancel")')
      
      // Verify back to reschedule modal
      await expect(page.locator('text=Reschedule Encounter')).toBeVisible()
    }
  })

  test('should show today indicator', async ({ page }) => {
    // Navigate to calendar
    await page.goto('/provider/calendar')
    
    // Verify today's date is highlighted
    await expect(page.locator('.bg-blue-50')).toBeVisible()
    await expect(page.locator('.w-2.h-2.bg-blue-600')).toBeVisible()
  })

  test('should display encounter details in modal', async ({ page }) => {
    // Navigate to calendar
    await page.goto('/provider/calendar')
    
    // Find and click on an encounter
    const encounter = page.locator('.bg-green-100:first-child')
    if (await encounter.isVisible()) {
      await encounter.click()
      
      // Verify encounter details are shown
      await expect(page.locator('text=Patient:')).toBeVisible()
      await expect(page.locator('text=Current Time:')).toBeVisible()
    }
  })

  test('should handle empty calendar state', async ({ page }) => {
    // Navigate to calendar
    await page.goto('/provider/calendar')
    
    // If no encounters, calendar should still be functional
    await expect(page.locator('text=Calendar')).toBeVisible()
    await expect(page.locator('button:has-text("Previous")')).toBeVisible()
    await expect(page.locator('button:has-text("Next")')).toBeVisible()
  })

  test('should maintain calendar state after navigation', async ({ page }) => {
    // Navigate to calendar
    await page.goto('/provider/calendar')
    
    // Navigate to next month
    await page.click('button:has-text("Next")')
    
    // Navigate away and back
    await page.goto('/provider/dashboard')
    await page.goto('/provider/calendar')
    
    // Should still be on the next month
    const monthText = await page.locator('h2').textContent()
    expect(monthText).not.toContain(new Date().toLocaleString('default', { month: 'long' }))
  })
})
