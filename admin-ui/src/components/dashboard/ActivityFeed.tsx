import { Clock } from 'lucide-react'
import { ChartCard } from './ChartCard'
import { Skeleton } from '../ui'
import type { ActivityItem } from '../../types/dashboard'

interface Props {
  data?: ActivityItem[]
  isLoading: boolean
}

const TYPE_ICONS: Record<string, string> = {
  PROPERTY_CREATED: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
  LEAD_CREATED: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  LEAD_WON: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  LEAD_LOST: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  CONTRACT_SIGNED: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  INVOICE_PAID: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  CLIENT_CREATED: 'bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400',
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function ActivityFeed({ data, isLoading }: Props) {
  if (isLoading) {
    return (
      <ChartCard title="Recent Activity">
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton width="w-8" height="h-8" rounded />
              <div className="flex-1 space-y-1">
                <Skeleton height="h-3" width="w-3/4" />
                <Skeleton height="h-2.5" width="w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </ChartCard>
    )
  }

  return (
    <ChartCard title="Recent Activity">
      <div className="max-h-80 space-y-1 overflow-y-auto pr-1">
        {data?.length ? (
          data.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
            >
              <div
                className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                  TYPE_ICONS[activity.type] ?? 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                }`}
              >
                <Clock size={14} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-gray-700 dark:text-gray-300">{activity.description}</p>
                <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                  {timeAgo(activity.createdAt)}
                </p>
              </div>
            </div>
          ))
        ) : (
          <p className="py-8 text-center text-sm text-gray-400">No recent activity</p>
        )}
      </div>
    </ChartCard>
  )
}
