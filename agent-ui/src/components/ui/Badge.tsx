import { cn } from '../../utils'

type BadgeVariant = 'gray' | 'red' | 'yellow' | 'green' | 'blue' | 'indigo' | 'purple' | 'pink' | 'orange' | 'sky'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
}

const variantClasses: Record<BadgeVariant, string> = {
  gray: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  red: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
  yellow: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400',
  green: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
  blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
  indigo: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400',
  purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400',
  pink: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-400',
  orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400',
  sky: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-400',
}

export function Badge({ children, variant = 'gray', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variantClasses[variant],
        className,
      )}
    >
      {children}
    </span>
  )
}
