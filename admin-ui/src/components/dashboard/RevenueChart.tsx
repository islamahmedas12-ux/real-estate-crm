import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { ChartCard } from './ChartCard'
import { Skeleton } from '../ui'
import type { RevenueResponse } from '../../types/dashboard'

interface Props {
  data?: RevenueResponse
  isLoading: boolean
}

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`
  return `$${value}`
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function RevenueChart({ data, isLoading }: Props) {
  if (isLoading) {
    return (
      <ChartCard title="Revenue">
        <Skeleton height="h-64" />
      </ChartCard>
    )
  }

  const changePercent = data?.changePercent ?? 0
  const isPositive = changePercent >= 0

  return (
    <ChartCard
      title="Revenue"
      subtitle={`Total: ${formatCurrency(data?.total ?? 0)}`}
      action={
        data?.changePercent != null ? (
          <div
            className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
              isPositive
                ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            }`}
          >
            {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {isPositive ? '+' : ''}{changePercent}%
          </div>
        ) : undefined
      }
    >
      <div className="h-64">
        {data?.timeline.length ? (
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <AreaChart data={data.timeline} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                tick={{ fontSize: 11 }}
                className="text-gray-500 dark:text-gray-400"
              />
              <YAxis
                tickFormatter={formatCurrency}
                tick={{ fontSize: 11 }}
                className="text-gray-500 dark:text-gray-400"
              />
              <Tooltip
                formatter={(value: unknown) => [formatCurrency(Number(value)), 'Revenue']}
                labelFormatter={(label: unknown) => formatDate(String(label))}
                contentStyle={{
                  backgroundColor: 'rgba(17, 24, 39, 0.9)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#f9fafb',
                  fontSize: '12px',
                }}
              />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="#6366f1"
                strokeWidth={2}
                fill="url(#revenueGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-gray-400">
            No revenue data for this period
          </div>
        )}
      </div>
    </ChartCard>
  )
}
