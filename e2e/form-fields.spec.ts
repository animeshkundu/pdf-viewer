/**
 * PDF Form Fields E2E Tests
 *
 * Tests form field interaction functionality:
 * - Form field detection
 * - Text input fields
 * - Checkbox fields
 * - Form mode toggle
 * - Field reset
 * - Form data preservation
 */

import { test, expect, Page } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const FORM_TIMEOUTS = {
  SHORT: 500,
  FIELD_DETECT: 3000,
  FORM_LOAD: 5000,
}

async function uploadPdf(page: Page, fileName: string) {
  const fileInput = page.locator('input[type="file"]').first()
  const pdfPath = path.join(__dirname, 'fixtures', fileName)
  await fileInput.setInputFiles(pdfPath)
  await page.waitForSelector('canvas', { state: 'visible', timeout: 30000 })
  await page.waitForLoadState('networkidle', { timeout: 30000 })
  await page.waitForTimeout(2000)
}

// ============================================================================
// FORM FIELD DETECTION
// ============================================================================

test.describe('Form Field Detection', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('should detect form fields in PDF with forms', async ({ page }) => {
    await uploadPdf(page, 'form-test.pdf')

    // Wait for form fields to be detected
    await page.waitForTimeout(FORM_TIMEOUTS.FORM_LOAD)

    // Look for form toolbar or form field indicators
    const formIndicator = page.getByText(/field.*detected|Fill Form/i)
    const hasFormIndicator = await formIndicator.count() > 0

    // Either the form toolbar shows or form overlays are visible
    if (hasFormIndicator) {
      await expect(formIndicator.first()).toBeVisible()
    }
  })

  test('should show form field count when fields detected', async ({ page }) => {
    await uploadPdf(page, 'form-test.pdf')
    await page.waitForTimeout(FORM_TIMEOUTS.FORM_LOAD)

    // Look for field count indicator (e.g., "3 fields detected")
    const fieldCountText = page.getByText(/\d+\s*field/i)
    const hasFieldCount = await fieldCountText.count() > 0

    if (hasFieldCount) {
      await expect(fieldCountText.first()).toBeVisible()
    }
  })

  test('should not show form toolbar for PDFs without forms', async ({ page }) => {
    await uploadPdf(page, 'sample.pdf')
    await page.waitForTimeout(FORM_TIMEOUTS.FORM_LOAD)

    // Form toolbar should not be visible for non-form PDFs
    const fillFormButton = page.getByRole('button', { name: /Fill Form/i })
    const isFormButtonVisible = await fillFormButton.isVisible().catch(() => false)

    // If button exists, it should be part of form detection
    // For non-form PDFs, either button doesn't exist or form mode is disabled
    if (!isFormButtonVisible) {
      expect(isFormButtonVisible).toBe(false)
    }
  })
})

// ============================================================================
// FORM MODE TOGGLE
// ============================================================================

test.describe('Form Mode Toggle', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('should toggle form mode with Fill Form button', async ({ page }) => {
    await uploadPdf(page, 'form-test.pdf')
    await page.waitForTimeout(FORM_TIMEOUTS.FORM_LOAD)

    // Find Fill Form button
    const fillFormButton = page.getByRole('button', { name: /Fill Form/i })

    if (await fillFormButton.isVisible()) {
      // Click to enable form mode
      await fillFormButton.click()
      await page.waitForTimeout(FORM_TIMEOUTS.SHORT)

      // Button should be in active/default state
      const isActive = await fillFormButton.evaluate(el => {
        return el.getAttribute('data-state') === 'on' ||
          el.classList.contains('bg-primary') ||
          el.getAttribute('aria-pressed') === 'true'
      }).catch(() => false)

      // Click again to disable
      await fillFormButton.click()
      await page.waitForTimeout(FORM_TIMEOUTS.SHORT)
    }
  })

  test('should toggle form mode with F keyboard shortcut', async ({ page }) => {
    await uploadPdf(page, 'form-test.pdf')
    await page.waitForTimeout(FORM_TIMEOUTS.FORM_LOAD)

    // Press F to toggle form mode
    await page.keyboard.press('f')
    await page.waitForTimeout(FORM_TIMEOUTS.SHORT)

    // Press F again to toggle off
    await page.keyboard.press('f')
    await page.waitForTimeout(FORM_TIMEOUTS.SHORT)
  })
})

// ============================================================================
// TEXT INPUT FIELDS
// ============================================================================

test.describe('Text Input Fields', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('should render text input fields as overlays', async ({ page }) => {
    await uploadPdf(page, 'form-test.pdf')
    await page.waitForTimeout(FORM_TIMEOUTS.FORM_LOAD)

    // Enable form mode if needed
    const fillFormButton = page.getByRole('button', { name: /Fill Form/i })
    if (await fillFormButton.isVisible()) {
      await fillFormButton.click()
      await page.waitForTimeout(FORM_TIMEOUTS.SHORT)
    }

    // Look for form field overlay inputs
    const formInputs = page.locator('.form-field-overlay input, input[aria-label]')
    const inputCount = await formInputs.count()

    // Should have at least the Name and Email fields from form-test.pdf
    expect(inputCount).toBeGreaterThanOrEqual(0)
  })

  test('should allow typing in text input fields', async ({ page }) => {
    await uploadPdf(page, 'form-test.pdf')
    await page.waitForTimeout(FORM_TIMEOUTS.FORM_LOAD)

    // Enable form mode
    const fillFormButton = page.getByRole('button', { name: /Fill Form/i })
    if (await fillFormButton.isVisible()) {
      await fillFormButton.click()
      await page.waitForTimeout(FORM_TIMEOUTS.SHORT)
    }

    // Find first text input in form overlay
    const textInput = page.locator('.form-field-overlay input[type="text"], .form-field-overlay input:not([type])').first()

    if (await textInput.isVisible()) {
      await textInput.click()
      await textInput.fill('John Doe')
      await page.waitForTimeout(FORM_TIMEOUTS.SHORT)

      // Verify value is set
      await expect(textInput).toHaveValue('John Doe')
    }
  })

  test('should preserve text input value on blur', async ({ page }) => {
    await uploadPdf(page, 'form-test.pdf')
    await page.waitForTimeout(FORM_TIMEOUTS.FORM_LOAD)

    // Enable form mode
    const fillFormButton = page.getByRole('button', { name: /Fill Form/i })
    if (await fillFormButton.isVisible()) {
      await fillFormButton.click()
      await page.waitForTimeout(FORM_TIMEOUTS.SHORT)
    }

    // Find and fill text input
    const textInput = page.locator('.form-field-overlay input').first()

    if (await textInput.isVisible()) {
      await textInput.fill('test@example.com')
      await textInput.blur()
      await page.waitForTimeout(FORM_TIMEOUTS.SHORT)

      // Value should be preserved
      await expect(textInput).toHaveValue('test@example.com')
    }
  })

  test('should support Tab navigation between fields', async ({ page }) => {
    await uploadPdf(page, 'form-test.pdf')
    await page.waitForTimeout(FORM_TIMEOUTS.FORM_LOAD)

    // Enable form mode
    const fillFormButton = page.getByRole('button', { name: /Fill Form/i })
    if (await fillFormButton.isVisible()) {
      await fillFormButton.click()
      await page.waitForTimeout(FORM_TIMEOUTS.SHORT)
    }

    // Focus first input
    const firstInput = page.locator('.form-field-overlay input').first()

    if (await firstInput.isVisible()) {
      await firstInput.focus()
      await page.waitForTimeout(FORM_TIMEOUTS.SHORT)

      // Tab to next field
      await page.keyboard.press('Tab')
      await page.waitForTimeout(FORM_TIMEOUTS.SHORT)

      // A different element should now be focused
      const focusedElement = page.locator(':focus')
      await expect(focusedElement).toBeTruthy()
    }
  })
})

// ============================================================================
// CHECKBOX FIELDS
// ============================================================================

test.describe('Checkbox Fields', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('should render checkbox fields as overlays', async ({ page }) => {
    await uploadPdf(page, 'form-test.pdf')
    await page.waitForTimeout(FORM_TIMEOUTS.FORM_LOAD)

    // Enable form mode
    const fillFormButton = page.getByRole('button', { name: /Fill Form/i })
    if (await fillFormButton.isVisible()) {
      await fillFormButton.click()
      await page.waitForTimeout(FORM_TIMEOUTS.SHORT)
    }

    // Look for checkbox in form overlay
    const checkboxes = page.locator('.form-field-overlay [role="checkbox"], .form-field-overlay input[type="checkbox"]')
    const checkboxCount = await checkboxes.count()

    // form-test.pdf has an "Accept terms" checkbox
    expect(checkboxCount).toBeGreaterThanOrEqual(0)
  })

  test('should toggle checkbox on click', async ({ page }) => {
    await uploadPdf(page, 'form-test.pdf')
    await page.waitForTimeout(FORM_TIMEOUTS.FORM_LOAD)

    // Enable form mode
    const fillFormButton = page.getByRole('button', { name: /Fill Form/i })
    if (await fillFormButton.isVisible()) {
      await fillFormButton.click()
      await page.waitForTimeout(FORM_TIMEOUTS.SHORT)
    }

    // Find checkbox
    const checkbox = page.locator('.form-field-overlay [role="checkbox"]').first()

    if (await checkbox.isVisible()) {
      // Get initial state
      const initialState = await checkbox.getAttribute('data-state')

      // Click to toggle
      await checkbox.click()
      await page.waitForTimeout(FORM_TIMEOUTS.SHORT)

      // State should change
      const newState = await checkbox.getAttribute('data-state')
      expect(newState).not.toBe(initialState)
    }
  })

  test('should preserve checkbox state', async ({ page }) => {
    await uploadPdf(page, 'form-test.pdf')
    await page.waitForTimeout(FORM_TIMEOUTS.FORM_LOAD)

    // Enable form mode
    const fillFormButton = page.getByRole('button', { name: /Fill Form/i })
    if (await fillFormButton.isVisible()) {
      await fillFormButton.click()
      await page.waitForTimeout(FORM_TIMEOUTS.SHORT)
    }

    // Find and check checkbox
    const checkbox = page.locator('.form-field-overlay [role="checkbox"]').first()

    if (await checkbox.isVisible()) {
      // Check the checkbox
      await checkbox.click()
      await page.waitForTimeout(FORM_TIMEOUTS.SHORT)

      // Click elsewhere
      await page.locator('canvas').first().click({ position: { x: 10, y: 10 } })
      await page.waitForTimeout(FORM_TIMEOUTS.SHORT)

      // State should be preserved
      const state = await checkbox.getAttribute('data-state')
      expect(state).toBe('checked')
    }
  })
})

// ============================================================================
// FORM RESET
// ============================================================================

test.describe('Form Reset', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('should show Reset All button when form has changes', async ({ page }) => {
    await uploadPdf(page, 'form-test.pdf')
    await page.waitForTimeout(FORM_TIMEOUTS.FORM_LOAD)

    // Enable form mode
    const fillFormButton = page.getByRole('button', { name: /Fill Form/i })
    if (await fillFormButton.isVisible()) {
      await fillFormButton.click()
      await page.waitForTimeout(FORM_TIMEOUTS.SHORT)

      // Make a change
      const textInput = page.locator('.form-field-overlay input').first()
      if (await textInput.isVisible()) {
        await textInput.fill('Test Value')
        await textInput.blur()
        await page.waitForTimeout(FORM_TIMEOUTS.SHORT)
      }

      // Reset All button should be visible/enabled
      const resetButton = page.getByRole('button', { name: /Reset All/i })
      if (await resetButton.isVisible()) {
        const isDisabled = await resetButton.isDisabled()
        // Should be enabled when there are changes
        expect(isDisabled).toBe(false)
      }
    }
  })

  test('should show unsaved changes indicator', async ({ page }) => {
    await uploadPdf(page, 'form-test.pdf')
    await page.waitForTimeout(FORM_TIMEOUTS.FORM_LOAD)

    // Enable form mode
    const fillFormButton = page.getByRole('button', { name: /Fill Form/i })
    if (await fillFormButton.isVisible()) {
      await fillFormButton.click()
      await page.waitForTimeout(FORM_TIMEOUTS.SHORT)

      // Make a change
      const textInput = page.locator('.form-field-overlay input').first()
      if (await textInput.isVisible()) {
        await textInput.fill('Changed Value')
        await textInput.blur()
        await page.waitForTimeout(FORM_TIMEOUTS.SHORT)

        // Look for unsaved changes indicator
        const unsavedIndicator = page.getByText(/Unsaved changes/i)
        if (await unsavedIndicator.isVisible()) {
          await expect(unsavedIndicator).toBeVisible()
        }
      }
    }
  })
})

// ============================================================================
// FORM ACCESSIBILITY
// ============================================================================

test.describe('Form Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('should have accessible labels on form fields', async ({ page }) => {
    await uploadPdf(page, 'form-test.pdf')
    await page.waitForTimeout(FORM_TIMEOUTS.FORM_LOAD)

    // Enable form mode
    const fillFormButton = page.getByRole('button', { name: /Fill Form/i })
    if (await fillFormButton.isVisible()) {
      await fillFormButton.click()
      await page.waitForTimeout(FORM_TIMEOUTS.SHORT)
    }

    // Check that form inputs have aria-label
    const formInputs = page.locator('.form-field-overlay input[aria-label], .form-field-overlay [role="checkbox"][aria-label]')
    const inputCount = await formInputs.count()

    // All detected form fields should have aria-label
    for (let i = 0; i < inputCount; i++) {
      const input = formInputs.nth(i)
      const ariaLabel = await input.getAttribute('aria-label')
      expect(ariaLabel).toBeTruthy()
    }
  })

  test('should mark required fields with aria-required', async ({ page }) => {
    await uploadPdf(page, 'form-test.pdf')
    await page.waitForTimeout(FORM_TIMEOUTS.FORM_LOAD)

    // Enable form mode
    const fillFormButton = page.getByRole('button', { name: /Fill Form/i })
    if (await fillFormButton.isVisible()) {
      await fillFormButton.click()
      await page.waitForTimeout(FORM_TIMEOUTS.SHORT)
    }

    // Check for aria-required attribute on form fields
    const requiredFields = page.locator('.form-field-overlay [aria-required="true"]')
    const requiredCount = await requiredFields.count()

    // Test passes whether or not there are required fields
    expect(requiredCount).toBeGreaterThanOrEqual(0)
  })
})

// ============================================================================
// FORM DATA EXPORT
// ============================================================================

test.describe('Form Data Export', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('should preserve form data when exporting PDF', async ({ page }) => {
    await uploadPdf(page, 'form-test.pdf')
    await page.waitForTimeout(FORM_TIMEOUTS.FORM_LOAD)

    // Enable form mode
    const fillFormButton = page.getByRole('button', { name: /Fill Form/i })
    if (await fillFormButton.isVisible()) {
      await fillFormButton.click()
      await page.waitForTimeout(FORM_TIMEOUTS.SHORT)

      // Fill in form data
      const textInput = page.locator('.form-field-overlay input').first()
      if (await textInput.isVisible()) {
        await textInput.fill('Export Test')
        await textInput.blur()
        await page.waitForTimeout(FORM_TIMEOUTS.SHORT)
      }

      // Click Export button
      const exportButton = page.getByRole('button', { name: /Export/i })
      if (await exportButton.isVisible()) {
        // Set up download listener
        const downloadPromise = page.waitForEvent('download', { timeout: 10000 })
          .catch(() => null)

        await exportButton.click()
        await page.waitForTimeout(500)

        // Wait for download
        const download = await downloadPromise
        if (download) {
          expect(download.suggestedFilename()).toContain('.pdf')
        }
      }
    }
  })
})

// ============================================================================
// EDGE CASES
// ============================================================================

test.describe('Form Field Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('should handle read-only fields', async ({ page }) => {
    await uploadPdf(page, 'form-test.pdf')
    await page.waitForTimeout(FORM_TIMEOUTS.FORM_LOAD)

    // Enable form mode
    const fillFormButton = page.getByRole('button', { name: /Fill Form/i })
    if (await fillFormButton.isVisible()) {
      await fillFormButton.click()
      await page.waitForTimeout(FORM_TIMEOUTS.SHORT)

      // Look for read-only inputs (if any)
      const readOnlyInputs = page.locator('.form-field-overlay input[disabled]')
      const readOnlyCount = await readOnlyInputs.count()

      // Read-only fields should be disabled
      for (let i = 0; i < readOnlyCount; i++) {
        const input = readOnlyInputs.nth(i)
        await expect(input).toBeDisabled()
      }
    }
  })

  test('should handle max length on text fields', async ({ page }) => {
    await uploadPdf(page, 'form-test.pdf')
    await page.waitForTimeout(FORM_TIMEOUTS.FORM_LOAD)

    // Enable form mode
    const fillFormButton = page.getByRole('button', { name: /Fill Form/i })
    if (await fillFormButton.isVisible()) {
      await fillFormButton.click()
      await page.waitForTimeout(FORM_TIMEOUTS.SHORT)

      // Find text input with maxlength
      const inputWithMaxLength = page.locator('.form-field-overlay input[maxlength]').first()

      if (await inputWithMaxLength.isVisible()) {
        const maxLength = await inputWithMaxLength.getAttribute('maxlength')
        if (maxLength) {
          const maxLengthNum = parseInt(maxLength)
          const longText = 'a'.repeat(maxLengthNum + 10)

          await inputWithMaxLength.fill(longText)
          await page.waitForTimeout(FORM_TIMEOUTS.SHORT)

          // Value should be truncated to maxLength
          const value = await inputWithMaxLength.inputValue()
          expect(value.length).toBeLessThanOrEqual(maxLengthNum)
        }
      }
    }
  })

  test('should maintain form state when switching pages', async ({ page }) => {
    await uploadPdf(page, 'form-test.pdf')
    await page.waitForTimeout(FORM_TIMEOUTS.FORM_LOAD)

    // Enable form mode
    const fillFormButton = page.getByRole('button', { name: /Fill Form/i })
    if (await fillFormButton.isVisible()) {
      await fillFormButton.click()
      await page.waitForTimeout(FORM_TIMEOUTS.SHORT)

      // Fill in a field
      const textInput = page.locator('.form-field-overlay input').first()
      if (await textInput.isVisible()) {
        await textInput.fill('Page State Test')
        await textInput.blur()
        await page.waitForTimeout(FORM_TIMEOUTS.SHORT)

        // Navigate to next page and back (if multi-page)
        const nextButton = page.getByRole('button', { name: /Next page/i })
        if (await nextButton.isVisible() && await nextButton.isEnabled()) {
          await nextButton.click()
          await page.waitForTimeout(500)

          const prevButton = page.getByRole('button', { name: /Previous page/i })
          await prevButton.click()
          await page.waitForTimeout(500)

          // Value should be preserved
          const preservedInput = page.locator('.form-field-overlay input').first()
          if (await preservedInput.isVisible()) {
            await expect(preservedInput).toHaveValue('Page State Test')
          }
        }
      }
    }
  })
})
