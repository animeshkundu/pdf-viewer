/**
 * Shared E2E Test Helpers
 * 
 * Contains reusable functions for E2E tests with proper wait strategies
 * to reduce flakiness in CI environments.
 */

import { Page, expect } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Upload a PDF file and wait for it to load completely
 * Uses proper wait strategies instead of arbitrary timeouts
 */
export async function uploadPdfAndWaitForLoad(page: Page, fileName = 'sample.pdf') {
  const fileInput = page.locator('input[type="file"]').first()
  const samplePdfPath = path.join(__dirname, 'fixtures', fileName)
  
  await fileInput.setInputFiles(samplePdfPath)
  
  // Wait for the PDF to load - look for canvas element which indicates rendering
  await page.waitForSelector('canvas', { state: 'visible', timeout: 30000 })
  
  // Wait for network to be idle
  await page.waitForLoadState('networkidle', { timeout: 30000 })
  
  // Give extra time for PDF rendering to complete
  await page.waitForTimeout(2000)
}

/**
 * Activate text edit mode with proper waiting
 */
export async function activateTextEditMode(page: Page) {
  // Find and click the text edit button
  const textEditButton = page.getByRole('button', { name: /text edit/i }).or(
    page.locator('[data-testid="text-edit-button"]')
  ).or(
    page.locator('button:has-text("Text Edit")')
  ).first()
  
  // Wait for button to be available
  await textEditButton.waitFor({ state: 'visible', timeout: 10000 })
  
  // Click the button
  await textEditButton.click()
  
  // Wait for text edit mode to activate
  await page.waitForTimeout(3000) // MuPDF initialization
}

/**
 * Click on a canvas element with retry logic
 */
export async function clickCanvas(page: Page, options?: { x?: number; y?: number }) {
  const canvas = page.locator('canvas').first()
  
  // Wait for canvas to be visible and stable
  await canvas.waitFor({ state: 'visible', timeout: 10000 })
  await page.waitForTimeout(500) // Let canvas stabilize
  
  const position = options ? { x: options.x || 200, y: options.y || 300 } : undefined
  
  // Click with retry logic
  let attempts = 0
  const maxAttempts = 3
  
  while (attempts < maxAttempts) {
    try {
      if (position) {
        await canvas.click({ position, timeout: 10000 })
      } else {
        await canvas.click({ timeout: 10000 })
      }
      break
    } catch (error) {
      attempts++
      if (attempts >= maxAttempts) {
        throw error
      }
      await page.waitForTimeout(1000)
    }
  }
  
  // Wait for click to take effect
  await page.waitForTimeout(500)
}

/**
 * Wait for an element with proper error handling
 */
export async function waitForElement(page: Page, selector: string, timeout = 10000) {
  try {
    await page.waitForSelector(selector, { state: 'visible', timeout })
    return true
  } catch (error) {
    console.error(`Element not found: ${selector}`)
    return false
  }
}

/**
 * Click element with retry logic for flaky interactions
 */
export async function clickWithRetry(page: Page, selector: string, options?: { timeout?: number; maxAttempts?: number }) {
  const timeout = options?.timeout || 10000
  const maxAttempts = options?.maxAttempts || 3
  let attempts = 0
  
  while (attempts < maxAttempts) {
    try {
      const element = page.locator(selector).first()
      await element.waitFor({ state: 'visible', timeout })
      await element.click({ timeout })
      return true
    } catch (error) {
      attempts++
      if (attempts >= maxAttempts) {
        throw new Error(`Failed to click ${selector} after ${maxAttempts} attempts: ${error}`)
      }
      await page.waitForTimeout(1000)
    }
  }
  
  return false
}
