import type { ReactNode } from 'react'
import type { Control, FieldPath, FieldValues } from 'react-hook-form'

interface FormFieldProps<T extends FieldValues> {
  name: FieldPath<T>
  control?: Control<T>
  label?: string
  required?: boolean
  error?: string
  children: ReactNode
}

export function FormField<T extends FieldValues>({
  label,
  required,
  error,
  children,
}: FormFieldProps<T>) {
  return (
    <div>
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {required && <span className="ms-1 text-red-500">*</span>}
        </label>
      )}
      {children}
      {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  )
}