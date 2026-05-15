import { useNavigate } from 'react-router-dom'
import { Activity as ActivityIcon } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../context/AuthContext'
import { activitiesApi } from '../../api/activities'
import type { Activity } from '../../types'
import { cn } from '../../utils'

function SectionShell({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5', className)}>
      {children}
    </div>
  )
}

function SectionHeader({
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

export function RecentActivitiesSection() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const { data, isLoading } = useQuery({
    queryKey: ['agent-recent-activities', user?.id],
    queryFn: () => user?.id ? activitiesApi.byUser(user.id, { pageSize: 5 }) : activitiesApi.recent(5),
    staleTime: 30_000,
    enabled: !!user?.id,
  })

  const activities = Array.isArray(data?.data) ? data.data : []

  return (
    <SectionShell>
      <SectionHeader
        icon={ActivityIcon}
        title="Recent Activities"
        trailing={
          <button onClick={() => navigate('/activities')} className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
            View all
          </button>
        }
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
        </div>
      ) : activities.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-400 dark:text-gray-500">No recent activities yet.</p>
      ) : (
        <div className="relative">
          <div className="absolute start-[15px] top-2 bottom-2 w-px bg-gray-200 dark:bg-gray-700" />
          <div className="space-y-4">
            {(activities as Activity[]).map((a) => (
              <div key={a.id} className="flex items-start gap-3 relative">
                <div className="rounded-full p-1.5 z-10 bg-indigo-50 dark:bg-indigo-900/30">
                  <ActivityIcon size={14} className="text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-medium text-gray-900 dark:text-gray-100">{a.entityType}</span>{' '}
                    {a.description}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    {new Date(a.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </SectionShell>
  )
}