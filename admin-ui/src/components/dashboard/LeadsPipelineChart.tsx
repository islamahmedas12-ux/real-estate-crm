import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import { useState } from 'react'
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
  PROPOSAL: '#f97316',
  NEGOTIATION: '#f59e0b',
  WON: '#22c55e',
  LOST: '#ef4444',
}

function formatStatus(s: string): string {
  return s
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

type ChartMode = 'donut' | 'bar'

export function LeadsPipelineChart({ data, isLoading }: Props) {
  const [mode, setMode] = useState<ChartMode>('donut')

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
    fill: STATUS_COLORS[item.status] ?? '#6b7280',
  }))

  return (
    <ChartCard
      title="Lead Pipeline"
      subtitle={`Conversion rate: ${data?.conversionRate ?? 0}%`}
      action={
        <div className="flex items-center gap-3">
          <div className="flex gap-3 text-xs text-gray-500 dark:text-gray-400">
            <span>New: {data?.newLeadsInPeriod ?? 0}</span>
            <span>Won: {data?.wonLeadsInPeriod ?? 0}</span>
          </div>
          <div className="flex items-center rounded-md border border-gray-200 dark:border-gray-700 p-0.5">
            <button
              onClick={() => setMode('donut')}
              className={`px-2 py-0.5 text-[10px] font-medium rounded transition-colors ${
                mode === 'donut'
                  ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400'
                  : 'text-gray-400'
              }`}
            >
              Donut
            </button>
            <button
              onClick={() => setMode('bar')}
              className={`px-2 py-0.5 text-[10px] font-medium rounded transition-colors ${
                mode === 'bar'
                  ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400'
                  : 'text-gray-400'
              }`}
            >
              Bar
            </button>
          </div>
        </div>
      }
    >
      <div className="h-64">
        {pipeline.length ? (
          mode === 'donut' ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pipeline}
                  dataKey="count"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  innerRadius={55}
                  paddingAngle={2}
                  strokeWidth={0}
                >
                  {pipeline.map((entry) => (
                    <Cell key={entry.status} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(17, 24, 39, 0.9)',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#f9fafb',
                    fontSize: '12px',
                  }}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: '11px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
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
                    <Cell key={entry.status} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-gray-400">
            No lead data available
          </div>
        )}
      </div>
    </ChartCard>
  )
}
