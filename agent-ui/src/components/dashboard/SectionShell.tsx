import type { ReactNode } from 'react'
import { cn } from '../../utils'

export function SectionShell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5', className)}>
      {children}
    </div>
  )
}

export function SectionHeader({
  icon: Icon,
  title,
  trailing,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>
  title: string
  trailing?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <Icon size={18} className="text-gray-500 dark:text-gray-400" />
        <h2 className="font-semibold text-gray-800 dark:text-gray-200">{title}</h2>
      </div>
      {trailing}
    </div>
  )
}

export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
    </div>
  )
}