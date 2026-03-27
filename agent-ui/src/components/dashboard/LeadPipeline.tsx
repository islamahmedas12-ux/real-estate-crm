import { Users, ArrowRight } from 'lucide-react'
import { cn } from '../../utils'

interface PipelineStage {
  name: string
  count: number
  value: string
  color: string
  bgColor: string
}

const PIPELINE_STAGES: PipelineStage[] = [
  { name: 'New', count: 8, value: 'EGP 12.4M', color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-50 dark:bg-blue-900/30' },
  { name: 'Contacted', count: 12, value: 'EGP 28.1M', color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-50 dark:bg-amber-900/30' },
  { name: 'Viewing', count: 5, value: 'EGP 15.7M', color: 'text-purple-600 dark:text-purple-400', bgColor: 'bg-purple-50 dark:bg-purple-900/30' },
  { name: 'Negotiation', count: 3, value: 'EGP 9.2M', color: 'text-orange-600 dark:text-orange-400', bgColor: 'bg-orange-50 dark:bg-orange-900/30' },
  { name: 'Closed Won', count: 2, value: 'EGP 6.8M', color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-50 dark:bg-green-900/30' },
]

export function LeadPipeline() {
  const totalLeads = PIPELINE_STAGES.reduce((sum, s) => sum + s.count, 0)

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users size={18} className="text-gray-500 dark:text-gray-400" />
          <h2 className="font-semibold text-gray-800 dark:text-gray-200">Lead Pipeline</h2>
        </div>
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
          {totalLeads} total leads
        </span>
      </div>

      {/* Pipeline bar */}
      <div className="flex h-3 rounded-full overflow-hidden mb-4">
        {PIPELINE_STAGES.map((stage) => (
          <div
            key={stage.name}
            className={cn('transition-all', stage.bgColor.replace('bg-', 'bg-').replace('/30', '/60'))}
            style={{ width: `${(stage.count / totalLeads) * 100}%` }}
            title={`${stage.name}: ${stage.count}`}
          />
        ))}
      </div>

      {/* Stage cards */}
      <div className="flex items-center gap-1">
        {PIPELINE_STAGES.map((stage, i) => (
          <div key={stage.name} className="flex items-center flex-1 min-w-0">
            <div className={cn('rounded-lg p-3 w-full', stage.bgColor)}>
              <p className={cn('text-xs font-medium truncate', stage.color)}>{stage.name}</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100 mt-0.5">{stage.count}</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{stage.value}</p>
            </div>
            {i < PIPELINE_STAGES.length - 1 && (
              <ArrowRight size={14} className="text-gray-300 dark:text-gray-600 shrink-0 mx-0.5" />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
