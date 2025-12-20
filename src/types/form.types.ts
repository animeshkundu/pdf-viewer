export type FormFieldType = 'text' | 'checkbox' | 'radio' | 'dropdown' | 'multiline' | 'date'

export interface FormField {
  id: string
  type: FormFieldType
  name: string
  pageNumber: number
  rect: [number, number, number, number]
  value: string | boolean | string[]
  options?: string[]
  required?: boolean
  readOnly?: boolean
  maxLength?: number
  multiSelect?: boolean
  defaultValue?: string | boolean | string[]
  tooltip?: string
  flags?: number
}

export interface FormFieldUpdate {
  fieldId: string
  value: string | boolean | string[]
}

export interface FormState {
  fields: FormField[]
  values: Map<string, string | boolean | string[]>
  hasUnsavedChanges: boolean
}

export interface FormExportOptions {
  flatten: boolean
  includeAnnotations: boolean
}
