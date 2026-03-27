import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts'
import { ChartCard } from './ChartCard'
import { Skeleton } from '../ui'
import type { LeadsResponse } from '../../types/dashboard'

interface Props {
  data?: LeadsResponse
  isLoading: boolean
}

const STATUS_COLORS: Record<string, string> = {
  NEW: '#6366f1',
  CONTACTED: '#3b82f6',
  QUALIFIED: '#8b5cf6',
  NEGOTIATION: '#f59e0b',
  PROPOSAL: '#f97316',
  WON: '#22c55e',
  LOST: '#ef4444',
}

function formatStatus(s: string): string {
  return s
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export function LeadsPipelineChart({ data, isLoading }: Props) {
  if (isLoading) {
    return (
      <ChartCard title="Lead Pipeline">
        <Skeleton height="h-64" />
      </ChartCard>
    )
  }

  const pipeline = (data?.pipeline ?? []).map((item) => ({
    ...item,
    label: formatStatus(item.status),
  }))

  return (
    <ChartCard
      title="Lead Pipeline"
      subtitle={`Conversion rate: ${data?.conversionRate ?? 0}%`}
      action={
        <div className="flex gap-3 text-xs text-gray-500 dark:text-gray-400">
          <span>New: {data?.newLeadsInPeriod ?? 0}</span>
          <span>Won: {data?.wonLeadsInPeriod ?? 0}</span>
        </div>
      }
    >
      <div className="h-64">
        {pipeline.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={pipeline} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11 }}
                className="text-gray-500 dark:text-gray-400"
              />
              <YAxis tick={{ fontSize: 11 }} className="text-gray-500 dark:text-gray-400" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(17, 24, 39, 0.9)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#f9fafb',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {pipeline.map((entry) => (
                  <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? '#6b7280'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-gray-400">
            No lead data available
          </div>
        )}
      </div>
    </ChartCard>
  )
}
