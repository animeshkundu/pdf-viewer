import type { PDFDocumentProxy } from 'pdfjs-dist'
import { PDFDocument } from 'pdf-lib'
import type { FormField, FormFieldUpdate, FormFieldType } from '@/types/form.types'

export class FormService {
  private static instance: FormService
  private fields: FormField[] = []
  private fieldValues: Map<string, string | boolean | string[]> = new Map()

  private constructor() {}

  static getInstance(): FormService {
    if (!FormService.instance) {
      FormService.instance = new FormService()
    }
    return FormService.instance
  }

  async detectForms(pdfProxy: PDFDocumentProxy): Promise<FormField[]> {
    this.fields = []
    this.fieldValues.clear()

    try {
      const numPages = pdfProxy.numPages

      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const page = await pdfProxy.getPage(pageNum)
        const annotations = await page.getAnnotations()

        for (const annotation of annotations) {
          if (this.isFormAnnotation(annotation)) {
            const field = this.createFormField(annotation, pageNum)
            if (field) {
              this.fields.push(field)
              if (field.defaultValue !== undefined) {
                this.fieldValues.set(field.id, field.defaultValue)
              }
            }
          }
        }
      }

      return this.fields
    } catch (error) {
      console.error('Failed to detect forms:', error)
      return []
    }
  }

  private isFormAnnotation(annotation: any): boolean {
    const formTypes = ['Widget']
    return formTypes.includes(annotation.subtype)
  }

  private createFormField(annotation: any, pageNumber: number): FormField | null {
    try {
      const fieldType = this.getFieldType(annotation)
      if (!fieldType) return null

      const id = annotation.id || `field_${pageNumber}_${Math.random().toString(36).substr(2, 9)}`
      const name = annotation.fieldName || annotation.alternativeText || id
      const rect = annotation.rect || [0, 0, 100, 20]
      
      let defaultValue: string | boolean | string[] = ''
      if (fieldType === 'checkbox') {
        defaultValue = annotation.checkBox || annotation.buttonValue === 'Yes' || false
      } else if (annotation.fieldValue) {
        defaultValue = annotation.fieldValue
      }

      const field: FormField = {
        id,
        type: fieldType,
        name,
        pageNumber,
        rect,
        value: defaultValue,
        defaultValue,
        required: annotation.required || false,
        readOnly: annotation.readOnly || false,
        maxLength: annotation.maxLen,
        tooltip: annotation.alternativeText,
        flags: annotation.fieldFlags,
      }

      if (fieldType === 'dropdown' || fieldType === 'radio') {
        field.options = annotation.options?.map((opt: any) => 
          typeof opt === 'string' ? opt : opt.displayValue || opt.exportValue
        ) || []
        field.multiSelect = annotation.multiSelect || false
      }

      return field
    } catch (error) {
      console.error('Failed to create form field:', error)
      return null
    }
  }

  private getFieldType(annotation: any): FormFieldType | null {
    const fieldType = annotation.fieldType

    if (fieldType === 'Tx') {
      return annotation.multiLine ? 'multiline' : 'text'
    }
    if (fieldType === 'Btn') {
      if (annotation.checkBox) return 'checkbox'
      if (annotation.radioButton) return 'radio'
      return 'checkbox'
    }
    if (fieldType === 'Ch') {
      return 'dropdown'
    }

    return null
  }

  updateField(update: FormFieldUpdate): void {
    const field = this.fields.find(f => f.id === update.fieldId)
    if (field) {
      field.value = update.value
      this.fieldValues.set(update.fieldId, update.value)
    }
  }

  getField(fieldId: string): FormField | undefined {
    return this.fields.find(f => f.id === fieldId)
  }

  getAllFields(): FormField[] {
    return [...this.fields]
  }

  getFieldValue(fieldId: string): string | boolean | string[] | undefined {
    return this.fieldValues.get(fieldId)
  }

  hasFields(): boolean {
    return this.fields.length > 0
  }

  async applyFieldValues(pdfDoc: PDFDocument): Promise<void> {
    try {
      const form = pdfDoc.getForm()
      
      for (const field of this.fields) {
        const value = this.fieldValues.get(field.id)
        if (value === undefined) continue

        try {
          const pdfField = this.findPdfLibField(form, field)
          if (!pdfField) continue

          if (field.type === 'text' || field.type === 'multiline') {
            if (typeof value === 'string') {
              pdfField.setText(value)
            }
          } else if (field.type === 'checkbox') {
            if (typeof value === 'boolean') {
              if (value) {
                pdfField.check()
              } else {
                pdfField.uncheck()
              }
            }
          } else if (field.type === 'dropdown') {
            if (typeof value === 'string') {
              pdfField.select(value)
            } else if (Array.isArray(value) && field.multiSelect) {
              pdfField.select(value)
            }
          } else if (field.type === 'radio') {
            if (typeof value === 'string') {
              pdfField.select(value)
            }
          }
        } catch (fieldError) {
          console.warn(`Failed to set value for field ${field.id}:`, fieldError)
        }
      }
    } catch (error) {
      console.error('Failed to apply field values:', error)
      throw error
    }
  }

  private findPdfLibField(form: any, field: FormField): any {
    try {
      const fields = form.getFields()
      
      for (const pdfField of fields) {
        const fieldName = pdfField.getName()
        if (fieldName === field.name || fieldName === field.id) {
          return pdfField
        }
      }

      const textFields = form.getTextFields()
      for (const textField of textFields) {
        if (textField.getName() === field.name) {
          return textField
        }
      }

      const checkBoxes = form.getCheckBoxes()
      for (const checkBox of checkBoxes) {
        if (checkBox.getName() === field.name) {
          return checkBox
        }
      }

      const dropdowns = form.getDropdowns()
      for (const dropdown of dropdowns) {
        if (dropdown.getName() === field.name) {
          return dropdown
        }
      }

      const radioGroups = form.getRadioGroups()
      for (const radioGroup of radioGroups) {
        if (radioGroup.getName() === field.name) {
          return radioGroup
        }
      }

      return null
    } catch (error) {
      console.warn('Error finding pdf-lib field:', error)
      return null
    }
  }

  async flattenFields(pdfDoc: PDFDocument): Promise<void> {
    try {
      const form = pdfDoc.getForm()
      form.flatten()
    } catch (error) {
      console.error('Failed to flatten form fields:', error)
      throw error
    }
  }

  clearFields(): void {
    this.fields = []
    this.fieldValues.clear()
  }

  getFieldsByPage(pageNumber: number): FormField[] {
    return this.fields.filter(f => f.pageNumber === pageNumber)
  }

  hasUnsavedChanges(): boolean {
    return Array.from(this.fieldValues.entries()).some(([fieldId, value]) => {
      const field = this.fields.find(f => f.id === fieldId)
      return field && field.defaultValue !== value
    })
  }

  resetField(fieldId: string): void {
    const field = this.fields.find(f => f.id === fieldId)
    if (field && field.defaultValue !== undefined) {
      field.value = field.defaultValue
      this.fieldValues.set(fieldId, field.defaultValue)
    }
  }

  resetAllFields(): void {
    for (const field of this.fields) {
      if (field.defaultValue !== undefined) {
        field.value = field.defaultValue
        this.fieldValues.set(field.id, field.defaultValue)
      }
    }
  }
}

export const formService = FormService.getInstance()
