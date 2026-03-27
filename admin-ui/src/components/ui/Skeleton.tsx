import { cn } from '../../utils'

interface SkeletonProps {
  width?: string
  height?: string
  count?: number
  className?: string
  rounded?: boolean
}

export function Skeleton({
  width = 'w-full',
  height = 'h-4',
  count = 1,
  rounded = false,
  className,
}: SkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'animate-pulse bg-gray-200 dark:bg-gray-700',
            rounded ? 'rounded-full' : 'rounded',
            width,
            height,
            className,
          )}
        />
      ))}
    </>
  )
}
