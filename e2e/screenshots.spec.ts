/**
 * Screenshot Capture Tests
 *
 * This test file captures screenshots of key interfaces for each build.
 * Screenshots are uploaded as artifacts for visual reference and debugging.
 *
 * LLMs can use these screenshots to understand the current UI state
 * and compare against expected layouts.
 */

import { test, expect } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Screenshot directory
const SCREENSHOT_DIR = 'screenshots'

test.describe('Interface Screenshots', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('capture empty state', async ({ page }) => {
    // Capture the initial empty state (no PDF loaded)
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/01-empty-state.png`,
      fullPage: true
    })
  })

  test('capture main viewer with PDF', async ({ page }) => {
    // Load a sample PDF
    const fileInput = page.locator('input[type="file"]').first()
    const pdfPath = path.join(__dirname, 'fixtures', 'sample.pdf')
    await fileInput.setInputFiles(pdfPath)
    await page.waitForSelector('canvas', { state: 'visible', timeout: 30000 })
    await page.waitForTimeout(2000)

    // Capture main viewer
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/02-main-viewer.png`,
      fullPage: true
    })
  })

  test('capture thumbnail sidebar', async ({ page }) => {
    // Load multi-page PDF
    const fileInput = page.locator('input[type="file"]').first()
    const pdfPath = path.join(__dirname, 'fixtures', 'multi-page-test.pdf')
    await fileInput.setInputFiles(pdfPath)
    await page.waitForSelector('canvas', { state: 'visible', timeout: 30000 })
    await page.waitForTimeout(2000)

    // Open sidebar
    const sidebarButton = page.locator('[data-testid="sidebar-toggle"]')
    await sidebarButton.click()
    await page.waitForTimeout(1500)

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/03-sidebar-open.png`,
      fullPage: true
    })
  })

  test('capture export dialog', async ({ page }) => {
    // Load PDF
    const fileInput = page.locator('input[type="file"]').first()
    const pdfPath = path.join(__dirname, 'fixtures', 'sample.pdf')
    await fileInput.setInputFiles(pdfPath)
    await page.waitForSelector('canvas', { state: 'visible', timeout: 30000 })
    await page.waitForTimeout(2000)

    // Open export dialog
    await page.keyboard.press('Control+s')
    await page.waitForSelector('[data-testid="export-dialog"]', { state: 'visible', timeout: 5000 })
    await page.waitForTimeout(500)

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/04-export-dialog.png`,
      fullPage: true
    })
  })

  test('capture split dialog', async ({ page }) => {
    // Load multi-page PDF
    const fileInput = page.locator('input[type="file"]').first()
    const pdfPath = path.join(__dirname, 'fixtures', 'multi-page-test.pdf')
    await fileInput.setInputFiles(pdfPath)
    await page.waitForSelector('canvas', { state: 'visible', timeout: 30000 })
    await page.waitForTimeout(2000)

    // Open split dialog
    const splitButton = page.locator('[data-testid="split-button"]')
    await splitButton.click()
    await page.waitForSelector('[data-testid="split-dialog"]', { state: 'visible', timeout: 5000 })
    await page.waitForTimeout(500)

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/05-split-dialog.png`,
      fullPage: true
    })
  })

  test('capture merge dialog', async ({ page }) => {
    // Load PDF
    const fileInput = page.locator('input[type="file"]').first()
    const pdfPath = path.join(__dirname, 'fixtures', 'sample.pdf')
    await fileInput.setInputFiles(pdfPath)
    await page.waitForSelector('canvas', { state: 'visible', timeout: 30000 })
    await page.waitForTimeout(2000)

    // Open merge dialog
    const mergeButton = page.locator('[data-testid="merge-button"]')
    await mergeButton.click()
    await page.waitForSelector('[data-testid="merge-dialog"]', { state: 'visible', timeout: 5000 })
    await page.waitForTimeout(500)

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/06-merge-dialog.png`,
      fullPage: true
    })
  })

  test('capture watermark dialog', async ({ page }) => {
    // Load PDF
    const fileInput = page.locator('input[type="file"]').first()
    const pdfPath = path.join(__dirname, 'fixtures', 'sample.pdf')
    await fileInput.setInputFiles(pdfPath)
    await page.waitForSelector('canvas', { state: 'visible', timeout: 30000 })
    await page.waitForTimeout(2000)

    // Open watermark dialog
    const watermarkButton = page.locator('[data-testid="watermark-button"]')
    await watermarkButton.click()
    await page.waitForSelector('[data-testid="watermark-dialog"]', { state: 'visible', timeout: 5000 })
    await page.waitForTimeout(500)

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/07-watermark-dialog.png`,
      fullPage: true
    })
  })

  test('capture tools dropdown', async ({ page }) => {
    // Load PDF
    const fileInput = page.locator('input[type="file"]').first()
    const pdfPath = path.join(__dirname, 'fixtures', 'sample.pdf')
    await fileInput.setInputFiles(pdfPath)
    await page.waitForSelector('canvas', { state: 'visible', timeout: 30000 })
    await page.waitForTimeout(2000)

    // Open tools dropdown
    const toolsButton = page.locator('[data-testid="tools-button"]')
    await toolsButton.click()
    await page.waitForTimeout(500)

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/08-tools-dropdown.png`,
      fullPage: true
    })
  })

  test('capture search bar', async ({ page }) => {
    // Load PDF with text
    const fileInput = page.locator('input[type="file"]').first()
    const pdfPath = path.join(__dirname, 'fixtures', 'sample.pdf')
    await fileInput.setInputFiles(pdfPath)
    await page.waitForSelector('canvas', { state: 'visible', timeout: 30000 })
    await page.waitForTimeout(2000)

    // Open search
    await page.keyboard.press('Control+f')
    await page.waitForTimeout(500)

    // Type a search term
    const searchInput = page.getByPlaceholder(/Search in document/i)
    if (await searchInput.isVisible()) {
      await searchInput.fill('test')
      await page.waitForTimeout(500)
    }

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/09-search-active.png`,
      fullPage: true
    })
  })

  test('capture form mode (if available)', async ({ page }) => {
    // Load form PDF
    const fileInput = page.locator('input[type="file"]').first()
    const pdfPath = path.join(__dirname, 'fixtures', 'form-test.pdf')
    await fileInput.setInputFiles(pdfPath)
    await page.waitForSelector('canvas', { state: 'visible', timeout: 30000 })
    await page.waitForTimeout(2000)

    // Try to enable form mode
    const formsButton = page.locator('[data-testid="forms-toggle"]')
    if (await formsButton.isVisible()) {
      await formsButton.click()
      await page.waitForTimeout(1000)
    }

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/10-form-mode.png`,
      fullPage: true
    })
  })
})
