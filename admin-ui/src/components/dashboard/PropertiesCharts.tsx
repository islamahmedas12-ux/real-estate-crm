import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts'
import { ChartCard } from './ChartCard'
import { Skeleton } from '../ui'
import type { PropertiesResponse } from '../../types/dashboard'

interface Props {
  data?: PropertiesResponse
  isLoading: boolean
}

const STATUS_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6']
const TYPE_COLORS = ['#6366f1', '#3b82f6', '#22c55e', '#f59e0b', '#f97316', '#ef4444', '#8b5cf6']

function formatLabel(s: string): string {
  return s
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export function PropertiesCharts({ data, isLoading }: Props) {
  if (isLoading) {
    return (
      <ChartCard title="Properties">
        <Skeleton height="h-64" />
      </ChartCard>
    )
  }

  const byStatus = (data?.byStatus ?? []).map((item) => ({
    name: formatLabel(item.status),
    value: item.count,
  }))

  const byType = (data?.byType ?? []).map((item) => ({
    name: formatLabel(item.type),
    value: item.count,
  }))

  return (
    <ChartCard title="Properties by Status & Type" subtitle={`Total: ${data?.total ?? 0}`}>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="mb-1 text-center text-xs font-medium text-gray-500 dark:text-gray-400">
            By Status
          </p>
          <div className="h-52">
            {byStatus.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={byStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {byStatus.map((_, idx) => (
                      <Cell key={idx} fill={STATUS_COLORS[idx % STATUS_COLORS.length]} />
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
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-gray-400">
                No data
              </div>
            )}
          </div>
        </div>
        <div>
          <p className="mb-1 text-center text-xs font-medium text-gray-500 dark:text-gray-400">
            By Type
          </p>
          <div className="h-52">
            {byType.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={byType}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {byType.map((_, idx) => (
                      <Cell key={idx} fill={TYPE_COLORS[idx % TYPE_COLORS.length]} />
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
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-gray-400">
                No data
              </div>
            )}
          </div>
        </div>
      </div>
    </ChartCard>
  )
}
