import { useQuery } from '@tanstack/react-query'
import {
  Clock,
  Building2,
  Users,
  UserCheck,
  FileText,
  Receipt,
  ArrowRight,
} from 'lucide-react'
import { activitiesApi } from '../api/activities'
import { LoadingSpinner } from './ui/LoadingSpinner'
import { EmptyState } from './ui/EmptyState'
import { Badge } from './ui/Badge'
import { cn } from '../utils'
import type { Activity, ActivityEntityType, PaginatedResponse } from '../types'

// ─── helpers ──────────────────────────────────────────────────────

const ENTITY_ICON: Record<ActivityEntityType, React.ComponentType<{ size?: number; className?: string }>> = {
  PROPERTY: Building2,
  CLIENT: Users,
  LEAD: UserCheck,
  CONTRACT: FileText,
  INVOICE: Receipt,
}

const ENTITY_COLOR: Record<ActivityEntityType, string> = {
  PROPERTY: 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400',
  CLIENT: 'bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400',
  LEAD: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/40 dark:text-yellow-400',
  CONTRACT: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400',
  INVOICE: 'bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400',
}

const TYPE_BADGE_VARIANT: Record<string, 'green' | 'blue' | 'red' | 'yellow' | 'gray' | 'indigo'> = {
  CREATE: 'green',
  UPDATE: 'blue',
  DELETE: 'red',
  STATUS_CHANGE: 'yellow',
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(iso))
}

// ─── single timeline item ─────────────────────────────────────────

function ActivityItem({ activity }: { activity: Activity }) {
  const Icon = ENTITY_ICON[activity.entityType] ?? FileText
  const colorClass = ENTITY_COLOR[activity.entityType] ?? 'bg-gray-100 text-gray-600'
  const badgeVariant = TYPE_BADGE_VARIANT[activity.type] ?? 'gray'

  return (
    <li className="relative flex gap-3 pb-6 last:pb-0 group">
      {/* vertical line */}
      <div className="absolute left-[17px] top-9 bottom-0 w-px bg-gray-200 dark:bg-gray-700 group-last:hidden" />

      {/* icon */}
      <div className={cn('flex items-center justify-center w-9 h-9 rounded-full shrink-0 z-10', colorClass)}>
        <Icon size={16} />
      </div>

      {/* content */}
      <div className="flex-1 min-w-0 pt-0.5">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={badgeVariant}>{activity.type.replace('_', ' ')}</Badge>
          <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
            <Clock size={12} />
            {relativeTime(activity.createdAt)}
          </span>
        </div>
        <p className="mt-1 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
          {activity.description}
        </p>
        {activity.user && (
          <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
            by {activity.user.name}
          </p>
        )}
      </div>
    </li>
  )
}

// ─── main component ───────────────────────────────────────────────

interface ActivityLogProps {
  /** If provided, fetch activities for this specific entity */
  entityType?: ActivityEntityType
  entityId?: string
  /** Max items to show */
  limit?: number
  className?: string
}

export function ActivityLog({ entityType, entityId, limit = 20, className }: ActivityLogProps) {
  const queryKey = entityType && entityId
    ? ['activities', 'entity', entityType, entityId]
    : ['activities', 'recent']

  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      if (entityType && entityId) {
        return activitiesApi.byEntity(entityType, entityId, { pageSize: limit })
      }
      const items = await activitiesApi.recent(limit)
      return { data: items, total: items.length, page: 1, pageSize: limit, totalPages: 1 } as PaginatedResponse<Activity>
    },
  })

  if (isLoading) return <LoadingSpinner message="Loading activities..." />

  if (error) {
    return (
      <div className="text-center py-8 text-sm text-red-500">
        Failed to load activities.
      </div>
    )
  }

  const activities: Activity[] = data?.data ?? []

  if (!activities.length) {
    return (
      <EmptyState
        title="No activities yet"
        description="Activities will appear here as actions are performed."
        className={className}
      />
    )
  }

  return (
    <div className={cn('rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5', className)}>
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
        <ArrowRight size={16} className="text-indigo-500" />
        Activity Timeline
      </h3>
      <ul className="space-y-0">
        {activities.map((a) => (
          <ActivityItem key={a.id} activity={a} />
        ))}
      </ul>
    </div>
  )
}
