import type { ReactNode } from 'react'
import { cn } from '../../utils'

interface ChartCardProps {
  title: string
  subtitle?: string
  children: ReactNode
  className?: string
  action?: ReactNode
}

export function ChartCard({ title, subtitle, children, className, action }: ChartCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800',
        className,
      )}
    >
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h2 className="font-semibold text-gray-800 dark:text-gray-200">{title}</h2>
          {subtitle && (
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
          )}
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}
