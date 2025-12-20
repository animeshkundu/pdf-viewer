import { test, expect } from '@playwright/test'

test.describe('PDF Viewer App', () => {
  test('should load the application', async ({ page }) => {
    await page.goto('/')
    
    // Check if the main page elements are present
    await expect(page).toHaveTitle(/PDF Viewer/)
    
    // Check for file input or drop zone
    const fileInput = page.locator('input[type="file"]')
    await expect(fileInput).toBeAttached()
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
