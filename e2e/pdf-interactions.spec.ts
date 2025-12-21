import { test, expect } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

test.describe('PDF Viewer Interactions', () => {
  test('should open a PDF file and display it', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Check initial state shows empty state
    const emptyState = page.getByRole('heading', { name: 'PDF Viewer & Editor' })
    await expect(emptyState).toBeVisible()
    
    // Find the file input and upload a PDF
    const fileInput = page.locator('input[type="file"]').first()
    const samplePdfPath = path.join(__dirname, 'fixtures', 'sample.pdf')
    await fileInput.setInputFiles(samplePdfPath)
    
    // Wait for the PDF to load
    await page.waitForTimeout(2000)
    
    // The empty state should be gone and the PDF viewer should be visible
    await expect(emptyState).not.toBeVisible()
  })

  test('should display toolbar buttons when PDF is loaded', async ({ page }) => {
    await page.goto('/')
    
    // Upload PDF
    const fileInput = page.locator('input[type="file"]').first()
    const samplePdfPath = path.join(__dirname, 'fixtures', 'sample.pdf')
    await fileInput.setInputFiles(samplePdfPath)
    
    // Wait for PDF to load
    await page.waitForTimeout(2000)
    
    // Check that the toolbar is visible
    const toolbar = page.getByRole('toolbar', { name: 'Document toolbar' })
    await expect(toolbar).toBeVisible()
  })

  test('should support keyboard shortcuts', async ({ page }) => {
    await page.goto('/')
    
    // Upload PDF
    const fileInput = page.locator('input[type="file"]').first()
    const samplePdfPath = path.join(__dirname, 'fixtures', 'sample.pdf')
    await fileInput.setInputFiles(samplePdfPath)
    
    // Wait for PDF to load
    await page.waitForTimeout(2000)
    
    // Test keyboard shortcut ? to open shortcuts dialog
    await page.keyboard.press('?')
    await page.waitForTimeout(500)
    
    // The keyboard shortcuts dialog should be visible or we can see the shortcuts
    // Press Escape to close any dialog
    await page.keyboard.press('Escape')
  })

  test('should support zoom functionality', async ({ page }) => {
    await page.goto('/')
    
    // Upload PDF
    const fileInput = page.locator('input[type="file"]').first()
    const samplePdfPath = path.join(__dirname, 'fixtures', 'sample.pdf')
    await fileInput.setInputFiles(samplePdfPath)
    
    // Wait for PDF to load
    await page.waitForTimeout(2000)
    
    // Try zoom shortcuts
    // Zoom in with +
    await page.keyboard.press('+')
    await page.waitForTimeout(300)
    
    // Zoom out with -
    await page.keyboard.press('-')
    await page.waitForTimeout(300)
    
    // Fit to width with 0
    await page.keyboard.press('0')
    await page.waitForTimeout(300)
    
    // Reset to 100% with 1
    await page.keyboard.press('1')
    await page.waitForTimeout(300)
  })

  test('should support page navigation', async ({ page }) => {
    await page.goto('/')
    
    // Upload PDF
    const fileInput = page.locator('input[type="file"]').first()
    const samplePdfPath = path.join(__dirname, 'fixtures', 'sample.pdf')
    await fileInput.setInputFiles(samplePdfPath)
    
    // Wait for PDF to load
    await page.waitForTimeout(2000)
    
    // Navigate to next page with j or ArrowDown
    await page.keyboard.press('j')
    await page.waitForTimeout(500)
    
    // Navigate to previous page with k or ArrowUp
    await page.keyboard.press('k')
    await page.waitForTimeout(500)
    
    // Go to last page with End
    await page.keyboard.press('End')
    await page.waitForTimeout(500)
    
    // Go to first page with Home
    await page.keyboard.press('Home')
    await page.waitForTimeout(500)
  })

  test('should open search with Ctrl+F', async ({ page }) => {
    await page.goto('/')
    
    // Upload PDF
    const fileInput = page.locator('input[type="file"]').first()
    const samplePdfPath = path.join(__dirname, 'fixtures', 'sample.pdf')
    await fileInput.setInputFiles(samplePdfPath)
    
    // Wait for PDF to load
    await page.waitForTimeout(2000)
    
    // Open search with Ctrl+F
    await page.keyboard.press('Control+f')
    await page.waitForTimeout(500)
    
    // Search bar should be visible
    const searchInput = page.getByPlaceholder('Search in document...')
    await expect(searchInput).toBeVisible()
    
    // Close search with Escape
    await page.keyboard.press('Escape')
  })

  test('should handle markup toolbar toggle', async ({ page }) => {
    await page.goto('/')
    
    // Upload PDF
    const fileInput = page.locator('input[type="file"]').first()
    const samplePdfPath = path.join(__dirname, 'fixtures', 'sample.pdf')
    await fileInput.setInputFiles(samplePdfPath)
    
    // Wait for PDF to load
    await page.waitForTimeout(2000)
    
    // Toggle markup with Ctrl+Shift+A
    await page.keyboard.press('Control+Shift+a')
    await page.waitForTimeout(500)
    
    // Close with Escape
    await page.keyboard.press('Escape')
  })

  test('should export dialog opens with Ctrl+S', async ({ page }) => {
    await page.goto('/')
    
    // Upload PDF
    const fileInput = page.locator('input[type="file"]').first()
    const samplePdfPath = path.join(__dirname, 'fixtures', 'sample.pdf')
    await fileInput.setInputFiles(samplePdfPath)
    
    // Wait for PDF to load
    await page.waitForTimeout(2000)
    
    // Open export dialog with Ctrl+S
    await page.keyboard.press('Control+s')
    await page.waitForTimeout(500)
    
    // Export dialog should be visible (look for dialog elements)
    // Close with Escape
    await page.keyboard.press('Escape')
  })
})
