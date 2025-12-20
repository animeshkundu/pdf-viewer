import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'
import type { FormField, FormFieldUpdate } from '@/types/form.types'
import { formService } from '@/services/form.service'
import { usePDF } from './usePDF'
import { toast } from 'sonner'

interface FormContextValue {
  fields: FormField[]
  hasForm: boolean
  isFormMode: boolean
  setIsFormMode: (enabled: boolean) => void
  updateField: (update: FormFieldUpdate) => void
  getField: (fieldId: string) => FormField | undefined
  getFieldValue: (fieldId: string) => string | boolean | string[] | undefined
  getFieldsByPage: (pageNumber: number) => FormField[]
  resetField: (fieldId: string) => void
  resetAllFields: () => void
  hasUnsavedChanges: boolean
}

const FormContext = createContext<FormContextValue | undefined>(undefined)

export function FormProvider({ children }: { children: ReactNode }) {
  const { document } = usePDF()
  const [fields, setFields] = useState<FormField[]>([])
  const [isFormMode, setIsFormMode] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  useEffect(() => {
    if (document) {
      loadForms()
    } else {
      setFields([])
      setIsFormMode(false)
      setHasUnsavedChanges(false)
    }
  }, [document])

  const loadForms = useCallback(async () => {
    if (!document) return

    try {
      const detectedFields = await formService.detectForms(document)
      setFields(detectedFields)
      
      if (detectedFields.length > 0) {
        const fieldCount = detectedFields.length
        const fieldWord = fieldCount === 1 ? 'field' : 'fields'
        toast.success(`Detected ${fieldCount} form ${fieldWord}`)
      }
    } catch (error) {
      console.error('Failed to load forms:', error)
      toast.error('Failed to detect form fields')
    }
  }, [document])

  const updateField = useCallback((update: FormFieldUpdate) => {
    formService.updateField(update)
    setFields([...formService.getAllFields()])
    setHasUnsavedChanges(formService.hasUnsavedChanges())
  }, [])

  const getField = useCallback((fieldId: string) => {
    return formService.getField(fieldId)
  }, [])

  const getFieldValue = useCallback((fieldId: string) => {
    return formService.getFieldValue(fieldId)
  }, [])

  const getFieldsByPage = useCallback((pageNumber: number) => {
    return formService.getFieldsByPage(pageNumber)
  }, [])

  const resetField = useCallback((fieldId: string) => {
    formService.resetField(fieldId)
    setFields([...formService.getAllFields()])
    setHasUnsavedChanges(formService.hasUnsavedChanges())
  }, [])

  const resetAllFields = useCallback(() => {
    formService.resetAllFields()
    setFields([...formService.getAllFields()])
    setHasUnsavedChanges(false)
    toast.success('All form fields reset')
  }, [])

  const contextValue = {
    fields,
    hasForm: fields.length > 0,
    isFormMode,
    setIsFormMode,
    updateField,
    getField,
    getFieldValue,
    getFieldsByPage,
    resetField,
    resetAllFields,
    hasUnsavedChanges,
  }

  return <FormContext.Provider value={contextValue}>{children}</FormContext.Provider>
}

export function useForm() {
  const context = useContext(FormContext)
  if (context === undefined) {
    throw new Error('useForm must be used within FormProvider')
  }
  return context
}
