import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Building2,
  Users,
  UserCheck,
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  Activity,
  Zap,
  UserPlus,
  ClipboardList,
  AlertTriangle,
  ArrowRight,
  Phone,
  RefreshCw,
  Loader2,
  BarChart3,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from 'recharts'
import { useQuery } from '@tanstack/react-query'
import { cn } from '../utils'
import { useAuth } from '../context/AuthContext'
import { StatsCard } from '../components/ui'
import { NotificationsPanel, UpcomingTasks, MyProperties } from '../components/dashboard'
import {
  fetchAgentOverview,
  fetchAgentLeadsPipeline,
  fetchAgentFollowUps,
  fetchAgentPerformance,
  type FollowUpItem,
  type PipelineStage,
} from '../api/dashboard'
import { activitiesApi as activitiesApiClient } from '../api/activities'

// ─── Constants ───────────────────────────────────────────────────────────────

const PIPELINE_COLORS: Record<string, string> = {
  NEW: '#3b82f6',
  CONTACTED: '#f59e0b',
  QUALIFIED: '#8b5cf6',
  PROPOSAL: '#ec4899',
  NEGOTIATION: '#f97316',
  WON: '#22c55e',
  LOST: '#ef4444',
}

const PIPELINE_LABELS: Record<string, string> = {
  NEW: 'New',
  CONTACTED: 'Contacted',
  QUALIFIED: 'Qualified',
  PROPOSAL: 'Proposal',
  NEGOTIATION: 'Negotiation',
  WON: 'Won',
  LOST: 'Lost',
}

const PRIORITY_BADGE: Record<string, string> = {
  URGENT: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
  HIGH: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400',
  MEDIUM: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  LOW: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionShell({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5',
        className,
      )}
    >
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

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 size={24} className="animate-spin text-indigo-500" />
    </div>
  )
}

function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center gap-3">
      <AlertTriangle size={28} className="text-red-400" />
      <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          <RefreshCw size={12} /> Retry
        </button>
      )}
    </div>
  )
}

// ─── Lead Pipeline Chart ─────────────────────────────────────────────────────

function LeadPipelineSection({
  pipeline,
  total,
}: {
  pipeline: PipelineStage[]
  total: number
}) {
  const chartData = pipeline
    .filter((s) => s.status !== 'LOST')
    .map((s) => ({
      name: PIPELINE_LABELS[s.status] ?? s.status,
      count: s.count,
      fill: PIPELINE_COLORS[s.status] ?? '#6b7280',
    }))

  const pieData = pipeline.map((s) => ({
    name: PIPELINE_LABELS[s.status] ?? s.status,
    value: s.count,
    fill: PIPELINE_COLORS[s.status] ?? '#6b7280',
  }))

  return (
    <SectionShell>
      <SectionHeader
        icon={Users}
        title="My Lead Pipeline"
        trailing={
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
            {total} total leads
          </span>
        }
      />

      {/* Pipeline progress bar */}
      {total > 0 && (
        <div className="flex h-3 rounded-full overflow-hidden mb-4">
          {pipeline.map((stage) => (
            <div
              key={stage.status}
              style={{
                width: `${(stage.count / total) * 100}%`,
                backgroundColor: PIPELINE_COLORS[stage.status] ?? '#6b7280',
                opacity: 0.7,
              }}
              title={`${PIPELINE_LABELS[stage.status]}: ${stage.count}`}
            />
          ))}
        </div>
      )}

      {/* Stage cards row */}
      <div className="flex items-center gap-1 mb-6">
        {pipeline
          .filter((s) => s.status !== 'LOST')
          .map((stage, i, arr) => {
            const color = PIPELINE_COLORS[stage.status] ?? '#6b7280'
            return (
              <div key={stage.status} className="flex items-center flex-1 min-w-0">
                <div
                  className="rounded-lg p-3 w-full"
                  style={{ backgroundColor: `${color}15` }}
                >
                  <p className="text-xs font-medium truncate" style={{ color }}>
                    {PIPELINE_LABELS[stage.status]}
                  </p>
                  <p className="text-lg font-bold text-gray-900 dark:text-gray-100 mt-0.5">
                    {stage.count}
                  </p>
                </div>
                {i < arr.length - 1 && (
                  <ArrowRight
                    size={14}
                    className="text-gray-300 dark:text-gray-600 shrink-0 mx-0.5"
                  />
                )}
              </div>
            )
          })}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Bar chart */}
        <div className="h-56">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
            Pipeline Distribution
          </p>
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <BarChart data={chartData} barSize={28}>
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  fontSize: 12,
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {chartData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart */}
        <div className="h-56">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
            Status Breakdown
          </p>
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={70}
                innerRadius={40}
                paddingAngle={2}
                strokeWidth={0}
              >
                {pieData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  fontSize: 12,
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 11 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </SectionShell>
  )
}

// ─── Follow-ups List ─────────────────────────────────────────────────────────

function FollowUpsSection({
  overdue,
  upcoming,
}: {
  overdue: FollowUpItem[]
  upcoming: FollowUpItem[]
}) {
  const [tab, setTab] = useState<'today' | 'overdue'>('today')
  const items = tab === 'overdue' ? overdue : upcoming

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

  return (
    <SectionShell>
      <SectionHeader
        icon={Clock}
        title="Follow-ups"
        trailing={
          <div className="flex gap-1">
            <button
              onClick={() => setTab('today')}
              className={cn(
                'px-2.5 py-1 text-xs font-medium rounded-md transition-colors',
                tab === 'today'
                  ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400',
              )}
            >
              Upcoming ({upcoming.length})
            </button>
            <button
              onClick={() => setTab('overdue')}
              className={cn(
                'px-2.5 py-1 text-xs font-medium rounded-md transition-colors',
                tab === 'overdue'
                  ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400',
              )}
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
            <div
              key={item.id}
              className={cn(
                'flex items-start gap-3 rounded-lg p-3 transition-colors',
                'border border-gray-100 dark:border-gray-700',
              )}
            >
              <div
                className={cn(
                  'mt-0.5 rounded-md p-1.5',
                  tab === 'overdue'
                    ? 'bg-red-50 dark:bg-red-900/30'
                    : 'bg-indigo-50 dark:bg-indigo-900/30',
                )}
              >
                {tab === 'overdue' ? (
                  <AlertTriangle size={16} className="text-red-500 dark:text-red-400" />
                ) : (
                  <Phone size={16} className="text-indigo-600 dark:text-indigo-400" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {item.client.firstName} {item.client.lastName}
                  </p>
                  <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">
                    {formatFollowUpTime(item.nextFollowUp)}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                  {item.property?.title ?? 'No property'} &middot; {item.client.phone}
                </p>
                <span
                  className={cn(
                    'inline-block mt-1.5 px-2 py-0.5 rounded text-[10px] font-medium',
                    PRIORITY_BADGE[item.priority] ?? PRIORITY_BADGE.LOW,
                  )}
                >
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

// ─── Performance Comparison ──────────────────────────────────────────────────

function PerformanceSection({
  thisMonth,
  lastMonth,
  change,
}: {
  thisMonth: { leads: number; won: number; revenue: number }
  lastMonth: { leads: number; won: number; revenue: number }
  change: { leads: number | null; won: number | null; revenue: number | null }
}) {
  const metrics = [
    { label: 'Leads', current: thisMonth.leads, previous: lastMonth.leads, change: change.leads, format: 'number' as const },
    { label: 'Deals Won', current: thisMonth.won, previous: lastMonth.won, change: change.won, format: 'number' as const },
    { label: 'Revenue', current: thisMonth.revenue, previous: lastMonth.revenue, change: change.revenue, format: 'currency' as const },
  ]

  const barData = [
    { name: 'Leads', 'This Month': thisMonth.leads, 'Last Month': lastMonth.leads },
    { name: 'Won', 'This Month': thisMonth.won, 'Last Month': lastMonth.won },
  ]

  function fmtVal(value: number, format: 'number' | 'currency'): string {
    if (format === 'currency') {
      if (value >= 1_000_000) return `EGP ${(value / 1_000_000).toFixed(1)}M`
      if (value >= 1_000) return `EGP ${(value / 1_000).toFixed(0)}K`
      return `EGP ${value.toLocaleString()}`
    }
    return value.toString()
  }

  return (
    <SectionShell>
      <SectionHeader
        icon={BarChart3}
        title="Performance vs Last Month"
      />

      <div className="grid grid-cols-3 gap-3 mb-5">
        {metrics.map((m) => {
          const dir =
            m.change === null ? 'flat' : m.change > 0 ? 'up' : m.change < 0 ? 'down' : 'flat'
          const TrendIcon = dir === 'up' ? TrendingUp : dir === 'down' ? TrendingDown : Minus

          return (
            <div
              key={m.label}
              className="rounded-lg border border-gray-100 dark:border-gray-700 p-3"
            >
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{m.label}</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {fmtVal(m.current, m.format)}
              </p>
              <div className="flex items-center gap-1 mt-1">
                <TrendIcon
                  size={12}
                  className={cn(
                    dir === 'up' && 'text-green-600 dark:text-green-400',
                    dir === 'down' && 'text-red-600 dark:text-red-400',
                    dir === 'flat' && 'text-gray-400',
                  )}
                />
                <span
                  className={cn(
                    'text-xs font-medium',
                    dir === 'up' && 'text-green-600 dark:text-green-400',
                    dir === 'down' && 'text-red-600 dark:text-red-400',
                    dir === 'flat' && 'text-gray-400',
                  )}
                >
                  {m.change !== null ? `${m.change > 0 ? '+' : ''}${m.change}%` : '--'}
                </span>
                <span className="text-[10px] text-gray-400">
                  vs {fmtVal(m.previous, m.format)}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
          <BarChart data={barData} barGap={4} barSize={24}>
            <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                borderRadius: 8,
                fontSize: 12,
                border: 'none',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              }}
            />
            <Bar dataKey="This Month" fill="#6366f1" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Last Month" fill="#c7d2fe" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </SectionShell>
  )
}

// ─── Quick Actions ───────────────────────────────────────────────────────────

function QuickActionsSection() {
  const navigate = useNavigate()

  const actions = [
    {
      label: 'Add Lead',
      description: 'Capture a new prospect',
      icon: UserPlus,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-900/30',
      path: '/leads',
    },
    {
      label: 'Add Client',
      description: 'Register a new client',
      icon: Users,
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-50 dark:bg-green-900/30',
      path: '/clients',
    },
    {
      label: 'Log Activity',
      description: 'Record a call or meeting',
      icon: ClipboardList,
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-50 dark:bg-purple-900/30',
      path: '/activities',
    },
  ]

  return (
    <SectionShell>
      <SectionHeader icon={Zap} title="Quick Actions" />
      <div className="space-y-2">
        {actions.map((action) => {
          const Icon = action.icon
          return (
            <button
              key={action.label}
              onClick={() => navigate(action.path)}
              className={cn(
                'w-full flex items-center gap-3 rounded-lg p-3 text-left transition-colors',
                'hover:bg-gray-50 dark:hover:bg-gray-700/50',
                'border border-gray-100 dark:border-gray-700',
              )}
            >
              <div className={cn('rounded-lg p-2', action.bg)}>
                <Icon size={18} className={action.color} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {action.label}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{action.description}</p>
              </div>
            </button>
          )
        })}
      </div>
    </SectionShell>
  )
}

// ─── Recent Activities (agent's own) ─────────────────────────────────────────

function RecentActivitiesSection() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const { data, isLoading } = useQuery({
    queryKey: ['agent-recent-activities', user?.id],
    queryFn: () =>
      user?.id
        ? activitiesApiClient.byUser(user.id, { pageSize: 5 })
        : activitiesApiClient.recent(5),
    staleTime: 30_000,
    enabled: !!user?.id,
  })

  const activities = Array.isArray(data?.data) ? data.data : []

  return (
    <SectionShell>
      <SectionHeader
        icon={Activity}
        title="Recent Activities"
        trailing={
          <button
            onClick={() => navigate('/activities')}
            className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            View all
          </button>
        }
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 size={20} className="animate-spin text-indigo-400" />
        </div>
      ) : activities.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-400 dark:text-gray-500">
          No recent activities yet.
        </p>
      ) : (
        <div className="relative">
          <div className="absolute left-[15px] top-2 bottom-2 w-px bg-gray-200 dark:bg-gray-700" />
          <div className="space-y-4">
            {(activities as import('../types').Activity[]).map((a) => (
              <div key={a.id} className="flex items-start gap-3 relative">
                <div className="rounded-full p-1.5 z-10 bg-indigo-50 dark:bg-indigo-900/30">
                  <Activity size={14} className="text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {a.entityType}
                    </span>{' '}
                    {a.description}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    {new Date(a.createdAt).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
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

// ─── Main DashboardPage ──────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAuth()

  const overview = useQuery({
    queryKey: ['agent-overview'],
    queryFn: fetchAgentOverview,
    staleTime: 60_000,
  })

  const pipeline = useQuery({
    queryKey: ['agent-leads-pipeline'],
    queryFn: fetchAgentLeadsPipeline,
    staleTime: 60_000,
  })

  const followUps = useQuery({
    queryKey: ['agent-follow-ups'],
    queryFn: fetchAgentFollowUps,
    staleTime: 60_000,
  })

  const performance = useQuery({
    queryKey: ['agent-performance'],
    queryFn: fetchAgentPerformance,
    staleTime: 60_000,
  })

  // Stats cards — derive from API data
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
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}!
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Here's a snapshot of your activity today.
        </p>
      </div>

      {/* Stats cards */}
      {overview.isLoading ? (
        <LoadingSpinner />
      ) : overview.isError ? (
        <ErrorBox message="Failed to load stats" onRetry={() => overview.refetch()} />
      ) : statsCards ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {statsCards.map((s) => (
            <StatsCard key={s.title} {...s} />
          ))}
        </div>
      ) : null}

      {/* Lead Pipeline — full width */}
      {pipeline.isLoading ? (
        <LoadingSpinner />
      ) : pipeline.isError ? (
        <ErrorBox message="Failed to load pipeline" onRetry={() => pipeline.refetch()} />
      ) : pipeline.data ? (
        <LeadPipelineSection
          pipeline={pipeline.data.pipeline}
          total={pipeline.data.total}
        />
      ) : null}

      {/* Main content: 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left column */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* My Assigned Properties */}
          <MyProperties />

          {/* Follow-ups */}
          {followUps.isLoading ? (
            <LoadingSpinner />
          ) : followUps.isError ? (
            <ErrorBox message="Failed to load follow-ups" onRetry={() => followUps.refetch()} />
          ) : followUps.data ? (
            <FollowUpsSection
              overdue={followUps.data.overdue}
              upcoming={followUps.data.upcoming}
            />
          ) : null}

          {/* Performance */}
          {performance.isLoading ? (
            <LoadingSpinner />
          ) : performance.isError ? (
            <ErrorBox
              message="Failed to load performance"
              onRetry={() => performance.refetch()}
            />
          ) : performance.data ? (
            <PerformanceSection
              thisMonth={performance.data.thisMonth}
              lastMonth={performance.data.lastMonth}
              change={performance.data.change}
            />
          ) : null}

          {/* Upcoming Tasks */}
          <UpcomingTasks />
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4">
          <QuickActionsSection />
          <RecentActivitiesSection />
          <NotificationsPanel />
        </div>
      </div>
    </div>
  )
}
