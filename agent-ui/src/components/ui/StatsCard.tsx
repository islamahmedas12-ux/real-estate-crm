import React from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '../../utils'

type ColorVariant = 'indigo' | 'green' | 'amber' | 'red' | 'purple' | 'sky'

interface StatsCardProps {
  title: string
  value: string | number
  change?: number
  icon: React.ComponentType<{ size?: number; className?: string }>
  color?: ColorVariant
  className?: string
}

const colorMap: Record<ColorVariant, { icon: string; bg: string }> = {
  indigo: { icon: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-900/30' },
  green:  { icon: 'text-green-600 dark:text-green-400',   bg: 'bg-green-50 dark:bg-green-900/30'   },
  amber:  { icon: 'text-amber-600 dark:text-amber-400',   bg: 'bg-amber-50 dark:bg-amber-900/30'   },
  red:    { icon: 'text-red-600 dark:text-red-400',       bg: 'bg-red-50 dark:bg-red-900/30'       },
  purple: { icon: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/30' },
  sky:    { icon: 'text-sky-600 dark:text-sky-400',       bg: 'bg-sky-50 dark:bg-sky-900/30'       },
}

export function StatsCard({
  title,
  value,
  change,
  icon: Icon,
  color = 'indigo',
  className,
}: StatsCardProps) {
  const colors = colorMap[color]
  const isPositive = change !== undefined && change >= 0

  return (
    <div
      className={cn(
        'rounded-xl border border-gray-200 bg-white p-5 shadow-sm',
        'dark:border-gray-700 dark:bg-gray-800',
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
          {change !== undefined && (
            <div
              className={cn(
                'mt-2 flex items-center gap-1 text-xs font-medium',
                isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400',
              )}
            >
              {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              <span>
                {isPositive ? '+' : ''}{change}% from last month
              </span>
            </div>
          )}
        </div>
        <div className={cn('rounded-lg p-2.5', colors.bg)}>
          <Icon size={20} className={colors.icon} />
        </div>
      </div>
    </div>
  )
}
