import { useAuth } from '../context/AuthContext'
import { StatsCard } from '../components/ui'
import {
  LeadPipelineSection,
  FollowUpsSection,
  PerformanceSection,
  RecentActivitiesSection,
  QuickActionsSection,
  UpcomingTasks,
  MyProperties,
  NotificationsPanel,
} from '../components/dashboard'
import { useAgentOverview, useAgentPerformance } from '../hooks/useDashboardData'

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const overview = useAgentOverview()
  const performance = useAgentPerformance()

  const statsCards = overview.data
    ? [
        {
          title: 'My Properties',
          value: overview.data.properties.toString(),
          icon: Building2,
          color: 'indigo' as const,
          change: undefined,
        },
        {
          title: 'Active Leads',
          value: overview.data.leads.toString(),
          icon: UserCheck,
          color: 'amber' as const,
          change: performance.data?.change.leads ?? undefined,
        },
        {
          title: 'My Clients',
          value: overview.data.clients.toString(),
          icon: Users,
          color: 'green' as const,
          change: undefined,
        },
        {
          title: 'Monthly Revenue',
          value: performance.data
            ? performance.data.thisMonth.revenue >= 1_000_000
              ? `EGP ${(performance.data.thisMonth.revenue / 1_000_000).toFixed(1)}M`
              : `EGP ${(performance.data.thisMonth.revenue / 1_000).toFixed(0)}K`
            : '--',
          icon: TrendingUp,
          color: 'green' as const,
          change: performance.data?.change.revenue ?? undefined,
        },
      ]
    : null

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}!
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Here's a snapshot of your activity today.
        </p>
      </div>

      {overview.isLoading ? (
        <LoadingSpinner />
      ) : overview.isError ? (
        <div className="rounded-xl border border-red-200 dark:border-red-800 bg-white dark:bg-gray-800 p-6 text-center">
          <p className="text-sm text-red-500 dark:text-red-400">Failed to load stats</p>
        </div>
      ) : statsCards ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {statsCards.map((s) => (
            <StatsCard key={s.title} {...s} />
          ))}
        </div>
      ) : null}

      <LeadPipelineSection />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 flex flex-col gap-4">
          <MyProperties />
          <FollowUpsSection />
          <PerformanceSection />
          <UpcomingTasks />
        </div>
        <div className="flex flex-col gap-4">
          <QuickActionsSection />
          <RecentActivitiesSection />
          <NotificationsPanel />
        </div>
      </div>
    </div>
  )
}

// Re-export icons used in statsCards so they're available if needed
import { Building2, Users, UserCheck, TrendingUp } from 'lucide-react'