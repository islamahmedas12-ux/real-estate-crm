import { useState } from 'react'
import { Building2, Users, UserCheck, FileText, DollarSign, TrendingUp } from 'lucide-react'
import { StatsCard } from '../components/ui'
import {
  DateRangeFilter,
  RevenueChart,
  LeadsPipelineChart,
  PropertiesCharts,
  ActivityFeed,
  AgentPerformanceTable,
} from '../components/dashboard'
import {
  useOverview,
  useRevenue,
  useLeads,
  useProperties,
  useAgents,
  useRecentActivities,
} from '../hooks/useDashboard'
import type { DateRangePreset, DateRangeParams } from '../types/dashboard'

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString()
}

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`
  return `$${n.toLocaleString()}`
}

export default function DashboardPage() {
  const [range, setRange] = useState<DateRangePreset>('this_month')
  const dateParams: DateRangeParams = { range }

  const overview = useOverview(dateParams)
  const revenue = useRevenue(dateParams)
  const leads = useLeads(dateParams)
  const properties = useProperties()
  const agents = useAgents(dateParams)
  const activities = useRecentActivities()

  const totals = overview.data?.totals
  const period = overview.data?.period

  const statsCards = [
    {
      title: 'Total Properties',
      value: totals ? formatNumber(totals.properties) : '--',
      change: period ? period.newProperties : undefined,
      icon: Building2,
      color: 'indigo' as const,
    },
    {
      title: 'Total Clients',
      value: totals ? formatNumber(totals.clients) : '--',
      change: period ? period.newClients : undefined,
      icon: Users,
      color: 'green' as const,
    },
    {
      title: 'Total Leads',
      value: totals ? formatNumber(totals.leads) : '--',
      change: period ? period.newLeads : undefined,
      icon: UserCheck,
      color: 'amber' as const,
    },
    {
      title: 'Total Revenue',
      value: totals ? formatCurrency(totals.revenue) : '--',
      icon: DollarSign,
      color: 'sky' as const,
    },
    {
      title: 'Active Contracts',
      value: totals ? formatNumber(totals.contracts) : '--',
      icon: FileText,
      color: 'purple' as const,
    },
    {
      title: 'Conversion Rate',
      value: leads.data ? `${leads.data.conversionRate}%` : '--',
      icon: TrendingUp,
      color: 'green' as const,
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Welcome back — here's what's happening.
          </p>
        </div>
        <DateRangeFilter value={range} onChange={setRange} />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {statsCards.map((s) => (
          <StatsCard key={s.title} {...s} />
        ))}
      </div>

      {/* Charts Row 1: Revenue + Lead Pipeline */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RevenueChart data={revenue.data} isLoading={revenue.isLoading} />
        <LeadsPipelineChart data={leads.data} isLoading={leads.isLoading} />
      </div>

      {/* Charts Row 2: Properties + Agent Performance */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <PropertiesCharts data={properties.data} isLoading={properties.isLoading} />
        <AgentPerformanceTable data={agents.data} isLoading={agents.isLoading} />
      </div>

      {/* Activity Feed */}
      <ActivityFeed data={activities.data} isLoading={activities.isLoading} />
    </div>
  )
}
