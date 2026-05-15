import { useState } from 'react'
import { Clock, Phone, AlertTriangle } from 'lucide-react'
import { cn } from '../../utils'
import { SectionShell, SectionHeader } from './SectionShell'
import { useAgentFollowUps } from '../../hooks/useDashboardData'
import { PRIORITY_BADGE } from './tokens'

function formatFollowUpTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = date.getTime() - now.getTime()
  const diffHrs = Math.round(diffMs / (1000 * 60 * 60))

  if (diffHrs < 0) {
    const absDays = Math.floor(Math.abs(diffMs) / (1000 * 60 * 60 * 24))
    if (absDays === 0) return 'Today (overdue)'
    return `${absDays}d overdue`
  }
  if (diffHrs < 24) return `In ${diffHrs}h`
  const days = Math.floor(diffHrs / 24)
  return `In ${days}d`
}

export function FollowUpsSection() {
  const [tab, setTab] = useState<'today' | 'overdue'>('today')
  const { data, isLoading, isError, refetch } = useAgentFollowUps()

  if (isLoading) return <SectionShell className="h-48 flex items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" /></SectionShell>
  if (isError) return <SectionShell><p className="text-sm text-red-500 text-center py-8">Failed to load follow-ups <button onClick={() => refetch()} className="underline ml-1">retry</button></p></SectionShell>

  const overdue = data?.overdue ?? []
  const upcoming = data?.upcoming ?? []
  const items = tab === 'overdue' ? overdue : upcoming

  return (
    <SectionShell>
      <SectionHeader
        icon={Clock}
        title="Follow-ups"
        trailing={
          <div className="flex gap-1">
            <button
              onClick={() => setTab('today')}
              className={cn('px-2.5 py-1 text-xs font-medium rounded-md transition-colors',
                tab === 'today' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400')}
            >
              Upcoming ({upcoming.length})
            </button>
            <button
              onClick={() => setTab('overdue')}
              className={cn('px-2.5 py-1 text-xs font-medium rounded-md transition-colors',
                tab === 'overdue' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400')}
            >
              Overdue ({overdue.length})
            </button>
          </div>
        }
      />

      {items.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-6">
          {tab === 'overdue' ? 'No overdue follow-ups!' : 'No upcoming follow-ups this week.'}
        </p>
      ) : (
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {items.map((item) => (
            <div key={item.id} className={cn('flex items-start gap-3 rounded-lg p-3 border border-gray-100 dark:border-gray-700')}>
              <div className={cn('mt-0.5 rounded-md p-1.5', tab === 'overdue' ? 'bg-red-50 dark:bg-red-900/30' : 'bg-indigo-50 dark:bg-indigo-900/30')}>
                {tab === 'overdue' ? <AlertTriangle size={16} className="text-red-500 dark:text-red-400" /> : <Phone size={16} className="text-indigo-600 dark:text-indigo-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.client.firstName} {item.client.lastName}</p>
                  <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">{formatFollowUpTime(item.nextFollowUp)}</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{item.property?.title ?? 'No property'} · {item.client.phone}</p>
                <span className={cn('inline-block mt-1.5 px-2 py-0.5 rounded text-[10px] font-medium', PRIORITY_BADGE[item.priority] ?? PRIORITY_BADGE.LOW)}>
                  {item.priority}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionShell>
  )
}