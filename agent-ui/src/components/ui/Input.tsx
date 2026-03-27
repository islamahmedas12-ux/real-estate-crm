import React from 'react'
import { cn } from '../../utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  leftAddon?: React.ReactNode
  rightAddon?: React.ReactNode
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftAddon, rightAddon, required, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          {leftAddon && (
            <div className="absolute left-3 text-gray-400 pointer-events-none">{leftAddon}</div>
          )}
          <input
            ref={ref}
            id={inputId}
            required={required}
            className={cn(
              'w-full rounded-lg border bg-white text-gray-900 text-sm',
              'px-3 py-2 placeholder:text-gray-400',
              'transition-colors duration-150',
              'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
              'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
              'dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500',
              error
                ? 'border-red-400 focus:ring-red-400 dark:border-red-500'
                : 'border-gray-300 dark:border-gray-600',
              leftAddon && 'pl-9',
              rightAddon && 'pr-9',
              className,
            )}
            {...props}
          />
          {rightAddon && (
            <div className="absolute right-3 text-gray-400">{rightAddon}</div>
          )}
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
        {hint && !error && <p className="text-xs text-gray-500 dark:text-gray-400">{hint}</p>}
      </div>
    )
  },
)

Input.displayName = 'Input'
