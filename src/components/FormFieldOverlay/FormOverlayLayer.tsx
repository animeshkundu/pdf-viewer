import { FormFieldOverlay } from './FormFieldOverlay'
import { useForm } from '@/hooks/useForm'

interface FormOverlayLayerProps {
  pageNumber: number
  scale: number
  pageWidth: number
  pageHeight: number
}

export function FormOverlayLayer({ pageNumber, scale, pageWidth, pageHeight }: FormOverlayLayerProps) {
  const { getFieldsByPage, updateField, getFieldValue, isFormMode } = useForm()

  if (!isFormMode) {
    return null
  }

  const fields = getFieldsByPage(pageNumber)

  if (fields.length === 0) {
    return null
  }

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        width: `${pageWidth * scale}px`,
        height: `${pageHeight * scale}px`,
      }}
    >
      <div className="relative w-full h-full pointer-events-auto">
        {fields.map((field) => (
          <FormFieldOverlay
            key={field.id}
            field={field}
            scale={scale}
            pageHeight={pageHeight}
            onUpdate={(fieldId, value) => updateField({ fieldId, value })}
            value={getFieldValue(field.id)}
          />
        ))}
      </div>
    </div>
  )
}
