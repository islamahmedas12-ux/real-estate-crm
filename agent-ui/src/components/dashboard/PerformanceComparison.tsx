import { TrendingUp, TrendingDown, Minus, BarChart3 } from 'lucide-react'
import { cn } from '../../utils'

interface Metric {
  label: string
  current: number
  previous: number
  format: 'number' | 'currency' | 'percent'
}

const METRICS: Metric[] = [
  { label: 'Leads Generated', current: 28, previous: 22, format: 'number' },
  { label: 'Viewings Booked', current: 14, previous: 18, format: 'number' },
  { label: 'Deals Closed', current: 4, previous: 3, format: 'number' },
  { label: 'Revenue (EGP)', current: 1_850_000, previous: 1_420_000, format: 'currency' },
  { label: 'Conversion Rate', current: 14.3, previous: 13.6, format: 'percent' },
  { label: 'Avg. Deal Size (EGP)', current: 462_500, previous: 473_333, format: 'currency' },
]

function formatValue(value: number, format: Metric['format']): string {
  if (format === 'currency') {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
    if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`
    return value.toLocaleString()
  }
  if (format === 'percent') return `${value}%`
  return value.toString()
}

function getChange(current: number, previous: number): { value: number; direction: 'up' | 'down' | 'flat' } {
  if (previous === 0) return { value: 0, direction: 'flat' }
  const change = ((current - previous) / previous) * 100
  if (Math.abs(change) < 0.5) return { value: 0, direction: 'flat' }
  return { value: Math.abs(Math.round(change)), direction: change > 0 ? 'up' : 'down' }
}

export function PerformanceComparison() {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 size={18} className="text-gray-500 dark:text-gray-400" />
          <h2 className="font-semibold text-gray-800 dark:text-gray-200">Performance vs Last Month</h2>
        </div>
        <span className="text-xs text-gray-400 dark:text-gray-500">March vs February</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {METRICS.map((metric) => {
          const change = getChange(metric.current, metric.previous)
          const TrendIcon = change.direction === 'up' ? TrendingUp : change.direction === 'down' ? TrendingDown : Minus

          return (
            <div
              key={metric.label}
              className="rounded-lg border border-gray-100 dark:border-gray-700 p-3"
            >
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 truncate">{metric.label}</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {formatValue(metric.current, metric.format)}
              </p>
              <div className="flex items-center gap-1 mt-1">
                <TrendIcon
                  size={12}
                  className={cn(
                    change.direction === 'up' && 'text-green-600 dark:text-green-400',
                    change.direction === 'down' && 'text-red-600 dark:text-red-400',
                    change.direction === 'flat' && 'text-gray-400 dark:text-gray-500',
                  )}
                />
                <span className={cn(
                  'text-xs font-medium',
                  change.direction === 'up' && 'text-green-600 dark:text-green-400',
                  change.direction === 'down' && 'text-red-600 dark:text-red-400',
                  change.direction === 'flat' && 'text-gray-400 dark:text-gray-500',
                )}>
                  {change.direction === 'flat' ? 'No change' : `${change.value}%`}
                </span>
                <span className="text-[10px] text-gray-400 dark:text-gray-500">
                  vs {formatValue(metric.previous, metric.format)}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
