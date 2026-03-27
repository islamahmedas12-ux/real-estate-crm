import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Activity as ActivityIcon, Clock, Filter } from 'lucide-react'
import { activitiesApi } from '../api/activities'
import { QuickLogActivity } from '../components/QuickLogActivity'
import { Select } from '../components/ui/Select'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { Pagination } from '../components/ui/Pagination'
import { EmptyState } from '../components/ui/EmptyState'
import { Badge } from '../components/ui/Badge'
import { formatDate } from '../utils'
import { useAuth } from '../context/AuthContext'
import type { Activity, ActivityEntityType } from '../types'

// ─── constants ────────────────────────────────────────────────────

const ENTITY_TYPE_OPTIONS = [
  { value: '', label: 'All Entities' },
  { value: 'PROPERTY', label: 'Property' },
  { value: 'CLIENT', label: 'Client' },
  { value: 'LEAD', label: 'Lead' },
  { value: 'CONTRACT', label: 'Contract' },
  { value: 'INVOICE', label: 'Invoice' },
]

const ACTIVITY_TYPE_OPTIONS = [
  { value: '', label: 'All Actions' },
  { value: 'CREATE', label: 'Create' },
  { value: 'UPDATE', label: 'Update' },
  { value: 'DELETE', label: 'Delete' },
  { value: 'STATUS_CHANGE', label: 'Status Change' },
  { value: 'CALL', label: 'Call' },
  { value: 'MEETING', label: 'Meeting' },
  { value: 'NOTE', label: 'Note' },
]

const SCOPE_OPTIONS = [
  { value: 'all', label: 'All Activities' },
  { value: 'mine', label: 'My Activities' },
]

// ─── page ─────────────────────────────────────────────────────────

export default function ActivitiesPage() {
  const { user } = useAuth()
  const [page, setPage] = useState(1)
  const [entityType, setEntityType] = useState('')
  const [activityType, setActivityType] = useState('')
  const [scope, setScope] = useState('all')

  const { data, isLoading } = useQuery({
    queryKey: ['activities', page, entityType, activityType, scope, user?.id],
    queryFn: () => {
      if (scope === 'mine' && user?.id) {
        return activitiesApi.byUser(user.id, {
          page,
          pageSize: 15,
          entityType: (entityType || undefined) as ActivityEntityType | undefined,
          type: activityType || undefined,
        })
      }
      return activitiesApi.list({
        page,
        pageSize: 15,
        entityType: (entityType || undefined) as ActivityEntityType | undefined,
        type: activityType || undefined,
      })
    },
  })

  const activities: Activity[] = data?.data ?? []
  const totalPages = data?.totalPages ?? 1

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Activities</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Log and review your daily activities across all entities.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Filter size={16} className="text-gray-400" />
        <div className="w-40">
          <Select
            options={SCOPE_OPTIONS}
            value={scope}
            onChange={(e) => { setScope(e.target.value); setPage(1) }}
          />
        </div>
        <div className="w-40">
          <Select
            options={ENTITY_TYPE_OPTIONS}
            value={entityType}
            onChange={(e) => { setEntityType(e.target.value); setPage(1) }}
          />
        </div>
        <div className="w-40">
          <Select
            options={ACTIVITY_TYPE_OPTIONS}
            value={activityType}
            onChange={(e) => { setActivityType(e.target.value); setPage(1) }}
          />
        </div>
      </div>

      {/* Activity list */}
      {isLoading ? (
        <LoadingSpinner message="Loading activities..." />
      ) : activities.length === 0 ? (
        <EmptyState
          icon={ActivityIcon}
          title="No activities found"
          description="Activities will appear here as actions are performed in the system."
        />
      ) : (
        <>
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-4 px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
              >
                {/* Icon */}
                <div className="flex items-center justify-center w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5">
                  <ActivityIcon size={16} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="gray">{activity.entityType}</Badge>
                    <Badge variant={
                      activity.type === 'CREATE' ? 'green'
                        : activity.type === 'DELETE' ? 'red'
                        : activity.type === 'STATUS_CHANGE' ? 'yellow'
                        : 'blue'
                    }>
                      {activity.type.replace('_', ' ')}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                    {activity.description}
                  </p>
                  <div className="mt-1 flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {formatDate(activity.createdAt)}
                    </span>
                    {activity.user && (
                      <span>by {activity.user.name}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center">
              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          )}
        </>
      )}

      {/* Floating action button */}
      <QuickLogActivity />
    </div>
  )
}
