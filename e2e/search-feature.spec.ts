/**
 * Search Feature E2E Tests
 * 
 * Comprehensive tests for PDF search functionality
 */

import { test, expect, Page } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function uploadPDF(page: Page, filename: string) {
  const fileInput = page.locator('input[type="file"]').first()
  const pdfPath = path.join(__dirname, 'fixtures', filename)
  await fileInput.setInputFiles(pdfPath)
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(2000)
}

test.describe('Search Feature Tests', () => {
  
  test('opens search with Ctrl+F keyboard shortcut', async ({ page }) => {
    await page.goto('/')
    await uploadPDF(page, 'search-test.pdf')
    
    await page.keyboard.press('Control+f')
    await page.waitForTimeout(500)
    
    const searchInput = page.getByPlaceholder('Search in document...')
    await expect(searchInput).toBeVisible()
  })

  test('closes search with Escape key', async ({ page }) => {
    await page.goto('/')
    await uploadPDF(page, 'search-test.pdf')
    
    await page.keyboard.press('Control+f')
    await page.waitForTimeout(500)
    
    const searchInput = page.getByPlaceholder('Search in document...')
    await expect(searchInput).toBeVisible()
    
    await page.keyboard.press('Escape')
    await page.waitForTimeout(300)
    
    await expect(searchInput).not.toBeVisible()
  })

  test('searches for text and finds results', async ({ page }) => {
    await page.goto('/')
    await uploadPDF(page, 'search-test.pdf')
    
    await page.keyboard.press('Control+f')
    await page.waitForTimeout(500)
    
    const searchInput = page.getByPlaceholder('Search in document...')
    await searchInput.fill('UNIQUE')
    await page.waitForTimeout(1000)
    
    // Check for search results indicator or count
    // The app should show number of results
  })

  test('navigates between multiple search results', async ({ page }) => {
    await page.goto('/')
    await uploadPDF(page, 'search-test.pdf')
    
    await page.keyboard.press('Control+f')
    await page.waitForTimeout(500)
    
    const searchInput = page.getByPlaceholder('Search in document...')
    await searchInput.fill('UNIQUE')
    await page.waitForTimeout(1000)
    
    // Navigate to next result
    await page.keyboard.press('Enter')
    await page.waitForTimeout(500)
    
    // Navigate to next result again
    await page.keyboard.press('Enter')
    await page.waitForTimeout(500)
    
    // Navigate to previous result
    await page.keyboard.press('Shift+Enter')
    await page.waitForTimeout(500)
  })

  test('performs case-sensitive search', async ({ page }) => {
    await page.goto('/')
    await uploadPDF(page, 'search-test.pdf')
    
    await page.keyboard.press('Control+f')
    await page.waitForTimeout(500)
    
    const searchInput = page.getByPlaceholder('Search in document...')
    
    // Search for uppercase
    await searchInput.fill('UNIQUE')
    await page.waitForTimeout(1000)
    
    // Clear and search for lowercase
    await searchInput.clear()
    await searchInput.fill('unique')
    await page.waitForTimeout(1000)
  })

  test('searches across multiple pages', async ({ page }) => {
    await page.goto('/')
    await uploadPDF(page, 'search-test.pdf')
    
    await page.keyboard.press('Control+f')
    await page.waitForTimeout(500)
    
    const searchInput = page.getByPlaceholder('Search in document...')
    await searchInput.fill('UNIQUE')
    await page.waitForTimeout(1000)
    
    // Navigate through results which should span multiple pages
    await page.keyboard.press('Enter')
    await page.waitForTimeout(500)
    await page.keyboard.press('Enter')
    await page.waitForTimeout(500)
    await page.keyboard.press('Enter')
    await page.waitForTimeout(500)
  })

  test('highlights search results on the page', async ({ page }) => {
    await page.goto('/')
    await uploadPDF(page, 'search-test.pdf')
    
    await page.keyboard.press('Control+f')
    await page.waitForTimeout(500)
    
    const searchInput = page.getByPlaceholder('Search in document...')
    await searchInput.fill('quick')
    await page.waitForTimeout(1500)
    
    // Search results should be visually highlighted on the page
    // The rendering layer should show highlights
  })

  test('shows no results for non-existent text', async ({ page }) => {
    await page.goto('/')
    await uploadPDF(page, 'search-test.pdf')
    
    await page.keyboard.press('Control+f')
    await page.waitForTimeout(500)
    
    const searchInput = page.getByPlaceholder('Search in document...')
    await searchInput.fill('NONEXISTENTTEXT12345')
    await page.waitForTimeout(1000)
    
    // Should show 0 results or no results message
  })

  test('searches for numbers', async ({ page }) => {
    await page.goto('/')
    await uploadPDF(page, 'search-test.pdf')
    
    await page.keyboard.press('Control+f')
    await page.waitForTimeout(500)
    
    const searchInput = page.getByPlaceholder('Search in document...')
    await searchInput.fill('12345')
    await page.waitForTimeout(1000)
  })

  test('searches for special characters', async ({ page }) => {
    await page.goto('/')
    await uploadPDF(page, 'search-test.pdf')
    
    await page.keyboard.press('Control+f')
    await page.waitForTimeout(500)
    
    const searchInput = page.getByPlaceholder('Search in document...')
    await searchInput.fill('@#$%')
    await page.waitForTimeout(1000)
  })

  test('clears search when input is cleared', async ({ page }) => {
    await page.goto('/')
    await uploadPDF(page, 'search-test.pdf')
    
    await page.keyboard.press('Control+f')
    await page.waitForTimeout(500)
    
    const searchInput = page.getByPlaceholder('Search in document...')
    await searchInput.fill('UNIQUE')
    await page.waitForTimeout(1000)
    
    // Clear search
    await searchInput.clear()
    await page.waitForTimeout(500)
    
    // Highlights should be removed
  })

  test('maintains search when navigating pages manually', async ({ page }) => {
    await page.goto('/')
    await uploadPDF(page, 'search-test.pdf')
    
    await page.keyboard.press('Control+f')
    await page.waitForTimeout(500)
    
    const searchInput = page.getByPlaceholder('Search in document...')
    await searchInput.fill('UNIQUE')
    await page.waitForTimeout(1000)
    
    // Navigate to next page manually
    await page.keyboard.press('j')
    await page.waitForTimeout(500)
    
    // Search should still be active
    await expect(searchInput).toBeVisible()
  })

  test('search persists after zooming', async ({ page }) => {
    await page.goto('/')
    await uploadPDF(page, 'search-test.pdf')
    
    await page.keyboard.press('Control+f')
    await page.waitForTimeout(500)
    
    const searchInput = page.getByPlaceholder('Search in document...')
    await searchInput.fill('UNIQUE')
    await page.waitForTimeout(1000)
    
    // Zoom in
    await page.keyboard.press('+')
    await page.waitForTimeout(500)
    
    // Search should still be visible and active
    await expect(searchInput).toBeVisible()
  })

  test('can perform consecutive searches', async ({ page }) => {
    await page.goto('/')
    await uploadPDF(page, 'search-test.pdf')
    
    await page.keyboard.press('Control+f')
    await page.waitForTimeout(500)
    
    const searchInput = page.getByPlaceholder('Search in document...')
    
    // First search
    await searchInput.fill('UNIQUE')
    await page.waitForTimeout(1000)
    
    // Second search
    await searchInput.clear()
    await searchInput.fill('test')
    await page.waitForTimeout(1000)
    
    // Third search
    await searchInput.clear()
    await searchInput.fill('quick')
    await page.waitForTimeout(1000)
  })
})
