import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp, TrendingDown, Minus, BarChart3 } from 'lucide-react'
import { cn } from '../../utils'
import { SectionShell, SectionHeader } from './SectionShell'
import { useAgentPerformance } from '../../hooks/useDashboardData'

function formatValue(value: number, format: 'number' | 'currency'): string {
  if (format === 'currency') {
    if (value >= 1_000_000) return `EGP ${(value / 1_000_000).toFixed(1)}M`
    if (value >= 1_000) return `EGP ${(value / 1_000).toFixed(0)}K`
    return `EGP ${value.toLocaleString()}`
  }
  return value.toString()
}

export function PerformanceSection() {
  const { data, isLoading, isError, refetch } = useAgentPerformance()

  const metrics = useMemo(() => {
    if (!data) return []
    return [
      { label: 'Leads', current: data.thisMonth.leads, previous: data.lastMonth.leads, change: data.change.leads, format: 'number' as const },
      { label: 'Deals Won', current: data.thisMonth.won, previous: data.lastMonth.won, change: data.change.won, format: 'number' as const },
      { label: 'Revenue', current: data.thisMonth.revenue, previous: data.lastMonth.revenue, change: data.change.revenue, format: 'currency' as const },
    ]
  }, [data])

  const barData = useMemo(() => {
    if (!data) return []
    return [
      { name: 'Leads', 'This Month': data.thisMonth.leads, 'Last Month': data.lastMonth.leads },
      { name: 'Won', 'This Month': data.thisMonth.won, 'Last Month': data.lastMonth.won },
    ]
  }, [data])

  if (isLoading) return <SectionShell className="h-48 flex items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" /></SectionShell>
  if (isError) return <SectionShell><p className="text-sm text-red-500 text-center py-8">Failed to load performance <button onClick={() => refetch()} className="underline ml-1">retry</button></p></SectionShell>

  return (
    <SectionShell>
      <SectionHeader icon={BarChart3} title="Performance vs Last Month" />

      <div className="grid grid-cols-3 gap-3 mb-5">
        {metrics.map((m) => {
          const dir = m.change === null ? 'flat' : m.change > 0 ? 'up' : m.change < 0 ? 'down' : 'flat'
          const TrendIcon = dir === 'up' ? TrendingUp : dir === 'down' ? TrendingDown : Minus

          return (
            <div key={m.label} className="rounded-lg border border-gray-100 dark:border-gray-700 p-3">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{m.label}</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{formatValue(m.current, m.format)}</p>
              <div className="flex items-center gap-1 mt-1">
                <TrendIcon size={12} className={cn(dir === 'up' && 'text-green-600 dark:text-green-400', dir === 'down' && 'text-red-600 dark:text-red-400', dir === 'flat' && 'text-gray-400')} />
                <span className={cn('text-xs font-medium', dir === 'up' && 'text-green-600 dark:text-green-400', dir === 'down' && 'text-red-600 dark:text-red-400', dir === 'flat' && 'text-gray-400')}>
                  {m.change !== null ? `${m.change > 0 ? '+' : ''}${m.change}%` : '--'}
                </span>
                <span className="text-[10px] text-gray-400">vs {formatValue(m.previous, m.format)}</span>
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
            <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
            <Bar dataKey="This Month" fill="#6366f1" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Last Month" fill="#c7d2fe" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </SectionShell>
  )
}