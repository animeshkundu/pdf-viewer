import { test, expect } from '@playwright/test'

test.describe('PDF Viewer App', () => {
  test('should load the application', async ({ page }) => {
    await page.goto('/')
    
    // Check if page title contains expected text
    await expect(page).toHaveTitle(/PDF/)
    
    // Check for main application container using first element
    const body = page.locator('body')
    await expect(body).toBeVisible()
    
    // Verify root element exists
    const root = page.locator('#root')
    await expect(root).toBeVisible()
  })

  test('should have basic UI elements', async ({ page }) => {
    await page.goto('/')
    
    // Wait for the app to load
    await page.waitForLoadState('networkidle')
    
    // Basic smoke test - ensure the page renders without errors
    const body = page.locator('body')
    await expect(body).toBeVisible()
  })
})
