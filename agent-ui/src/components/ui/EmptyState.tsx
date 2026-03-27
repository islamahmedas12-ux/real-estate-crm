import { Inbox } from 'lucide-react'
import { cn } from '../../utils'

interface EmptyStateProps {
  icon?: React.ComponentType<{ size?: number; className?: string }>
  title?: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({
  icon: Icon = Inbox,
  title = 'No data found',
  description = 'There are no items to display at this time.',
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 text-center',
        className,
      )}
    >
      <div className="rounded-full bg-gray-100 dark:bg-gray-700 p-4 mb-4">
        <Icon size={32} className="text-gray-400 dark:text-gray-500" />
      </div>
      <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">{title}</h3>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 max-w-sm">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
