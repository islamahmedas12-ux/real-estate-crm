import { Loader2 } from 'lucide-react'
import { cn } from '../../utils'

interface LoadingSpinnerProps {
  message?: string
  size?: number
  className?: string
  fullPage?: boolean
}

export function LoadingSpinner({
  message,
  size = 32,
  className,
  fullPage = false,
}: LoadingSpinnerProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 text-indigo-600 dark:text-indigo-400',
        fullPage && 'fixed inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-50',
        !fullPage && 'py-12',
        className,
      )}
    >
      <Loader2 size={size} className="animate-spin" />
      {message && (
        <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
      )}
    </div>
  )
}
