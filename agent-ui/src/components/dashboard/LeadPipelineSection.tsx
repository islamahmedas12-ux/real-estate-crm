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
import { Users, ArrowRight } from 'lucide-react'
import { SectionShell, SectionHeader, LoadingSpinner } from './SectionShell'
import { useAgentPipeline, usePipelineChartData } from '../../hooks/useDashboardData'
import { PIPELINE_COLORS, PIPELINE_LABELS } from './tokens'

export function LeadPipelineSection() {
  const { data: pipeline, isLoading, isError, refetch } = useAgentPipeline()
  const { barData, pieData } = usePipelineChartData(pipeline)

  if (isLoading) return <SectionShell><LoadingSpinner /></SectionShell>
  if (isError) return <SectionShell><p className="text-sm text-red-500 text-center py-8">Failed to load pipeline <button onClick={() => refetch()} className="underline ml-1">retry</button></p></SectionShell>

  const total = pipeline?.total ?? 0

  return (
    <SectionShell>
      <SectionHeader
        icon={Users}
        title="My Lead Pipeline"
        trailing={<span className="text-xs font-medium text-gray-500 dark:text-gray-400">{total} total leads</span>}
      />

      {total > 0 && (
        <div className="flex h-3 rounded-full overflow-hidden mb-4">
          {pipeline?.pipeline.map((stage) => (
            <div
              key={stage.status}
              style={{ width: `${(stage.count / total) * 100}%`, backgroundColor: PIPELINE_COLORS[stage.status] ?? '#6b7280', opacity: 0.7 }}
              title={`${PIPELINE_LABELS[stage.status]}: ${stage.count}`}
            />
          ))}
        </div>
      )}

      <div className="flex items-center gap-1 mb-6">
        {pipeline?.pipeline.filter((s) => s.status !== 'LOST').map((stage, i, arr) => {
          const color = PIPELINE_COLORS[stage.status] ?? '#6b7280'
          return (
            <div key={stage.status} className="flex items-center flex-1 min-w-0">
              <div className="rounded-lg p-3 w-full" style={{ backgroundColor: `${color}15` }}>
                <p className="text-xs font-medium truncate" style={{ color }}>{PIPELINE_LABELS[stage.status]}</p>
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100 mt-0.5">{stage.count}</p>
              </div>
              {i < arr.length - 1 && <ArrowRight size={14} className="text-gray-300 dark:text-gray-600 shrink-0 mx-0.5" />}
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="h-56">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Pipeline Distribution</p>
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <BarChart data={barData} barSize={28}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {barData.map((entry, idx) => <Cell key={idx} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="h-56">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Status Breakdown</p>
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={40} paddingAngle={2} strokeWidth={0}>
                {pieData.map((entry, idx) => <Cell key={idx} fill={entry.fill} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </SectionShell>
  )
}