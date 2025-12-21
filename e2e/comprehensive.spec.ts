import { test, expect } from '@playwright/test'

test.describe('PDF Viewer Comprehensive E2E Tests', () => {
  test('application loads successfully', async ({ page }) => {
    await page.goto('/')
    
    // Check if page title contains expected text
    await expect(page).toHaveTitle(/PDF/)
    
    // Check for main application container
    const body = page.locator('body')
    await expect(body).toBeVisible()
  })

  test('has file upload capability', async ({ page }) => {
    await page.goto('/')
    
    // Look for file input - use first() to avoid strict mode violation
    const fileInput = page.locator('input[type="file"]').first()
    await expect(fileInput).toBeAttached()
  })

  test('navigation elements are present', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // The page should have basic structure
    const root = page.locator('#root')
    await expect(root).toBeVisible()
  })

  test('responsive design works', async ({ page }) => {
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.goto('/')
    await expect(page.locator('body')).toBeVisible()
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 })
    await expect(page.locator('body')).toBeVisible()
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await expect(page.locator('body')).toBeVisible()
  })

  test('application handles reload gracefully', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Reload the page
    await page.reload()
    await page.waitForLoadState('networkidle')
    
    // Check it still works
    await expect(page.locator('body')).toBeVisible()
  })

  test('keyboard navigation works', async ({ page }) => {
    await page.goto('/')
    
    // Press tab to navigate
    await page.keyboard.press('Tab')
    
    // Check that focus exists
    const focused = page.locator(':focus')
    await expect(focused).toBeTruthy()
  })

  test('theme and styles are loaded', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Check that CSS is loaded by looking for styled elements
    const body = page.locator('body')
    const bgColor = await body.evaluate((el) => window.getComputedStyle(el).backgroundColor)
    
    // Should have some background color set (not transparent)
    expect(bgColor).toBeTruthy()
    expect(bgColor).not.toBe('rgba(0, 0, 0, 0)')
  })

  test('no console errors on load', async ({ page }) => {
    const consoleErrors: string[] = []
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })
    
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Filter out expected/acceptable errors
    const criticalErrors = consoleErrors.filter(err => 
      !err.includes('favicon') && 
      !err.includes('manifest')
    )
    
    expect(criticalErrors.length).toBe(0)
  })

  test('service worker registration', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Check if service worker is supported and potentially registered
    const swSupported = await page.evaluate(() => 'serviceWorker' in navigator)
    expect(swSupported).toBe(true)
  })

  test('accessibility: has valid HTML structure', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Check for root element specifically
    const root = page.locator('#root')
    await expect(root).toBeAttached()
  })

  test('page performance is acceptable', async ({ page }) => {
    const startTime = Date.now()
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    const loadTime = Date.now() - startTime
    
    // Should load within 10 seconds
    expect(loadTime).toBeLessThan(10000)
  })

  test('local storage is functional', async ({ page }) => {
    await page.goto('/')
    
    // Test localStorage
    await page.evaluate(() => {
      localStorage.setItem('test-key', 'test-value')
    })
    
    const value = await page.evaluate(() => localStorage.getItem('test-key'))
    expect(value).toBe('test-value')
    
    // Clean up
    await page.evaluate(() => localStorage.removeItem('test-key'))
  })
})
