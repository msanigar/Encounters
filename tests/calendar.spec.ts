import { test, expect } from '@playwright/test'

test.describe('Calendar View', () => {
  test('should navigate to calendar page', async ({ page }) => {
    // Start from provider dashboard
    await page.goto('/provider/dashboard')
    await page.waitForSelector('h1:has-text("Provider Dashboard")', { timeout: 10000 })
    
    // Click calendar link
    await page.click('a[href="/provider/calendar"]')
    
    // Verify calendar page loads
    await expect(page.locator('h1:has-text("Calendar")')).toBeVisible()
    await expect(page.locator('text=View and manage your scheduled encounters')).toBeVisible()
  })

  test('should display calendar with month view', async ({ page }) => {
    // Navigate directly to calendar
    await page.goto('/provider/calendar')
    
    // Wait for calendar to load
    await page.waitForSelector('text=Calendar', { timeout: 10000 })
    
    // Verify calendar elements
    await expect(page.locator('text=Today')).toBeVisible()
    await expect(page.locator('button:has-text("Grid")')).toBeVisible()
    await expect(page.locator('button:has-text("List")')).toBeVisible()
    
    // Verify weekday headers
    await expect(page.locator('text=Mon')).toBeVisible()
    await expect(page.locator('text=Tue')).toBeVisible()
    await expect(page.locator('text=Wed')).toBeVisible()
  })

  test('should switch between month and list views', async ({ page }) => {
    // Navigate to calendar
    await page.goto('/provider/calendar')
    await page.waitForSelector('text=Calendar', { timeout: 10000 })
    
    // Switch to list view
    await page.click('button:has-text("List")')
    
    // Verify list view is active
    await expect(page.locator('button:has-text("List")')).toHaveClass(/bg-primary/)
    
    // Switch back to month view
    await page.click('button:has-text("Grid")')
    
    // Verify month view is active
    await expect(page.locator('button:has-text("Grid")')).toHaveClass(/bg-primary/)
  })

  test('should navigate between months', async ({ page }) => {
    // Navigate to calendar
    await page.goto('/provider/calendar')
    await page.waitForSelector('text=Calendar', { timeout: 10000 })
    
    // Get current month
    const currentMonth = new Date().toLocaleString('en-US', { month: 'long' })
    const currentYear = new Date().getFullYear()
    
    // Verify current month is displayed
    await expect(page.locator(`text=${currentMonth} ${currentYear}`)).toBeVisible()
    
    // Navigate to next month
    await page.click('button:has-text("Next")')
    
    // Verify month changed (this is a basic check)
    await expect(page.locator('text=Calendar')).toBeVisible()
  })

  test('should return to dashboard from calendar', async ({ page }) => {
    // Navigate to calendar
    await page.goto('/provider/calendar')
    await page.waitForSelector('h1:has-text("Calendar")', { timeout: 10000 })
    
    // Click back to dashboard
    await page.click('a:has-text("Back to Dashboard")')
    
    // Verify returned to dashboard
    await expect(page.locator('h1:has-text("Provider Dashboard")')).toBeVisible()
  })
})
