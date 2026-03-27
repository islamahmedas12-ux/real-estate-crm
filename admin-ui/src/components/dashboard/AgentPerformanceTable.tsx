import { ChartCard } from './ChartCard'
import { Skeleton } from '../ui'
import type { AgentsResponse } from '../../types/dashboard'

interface Props {
  data?: AgentsResponse
  isLoading: boolean
}

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`
  return `$${value.toFixed(0)}`
}

export function AgentPerformanceTable({ data, isLoading }: Props) {
  if (isLoading) {
    return (
      <ChartCard title="Top Agents">
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} height="h-8" />
          ))}
        </div>
      </ChartCard>
    )
  }

  const agents = data?.agents?.slice(0, 10) ?? []

  return (
    <ChartCard title="Top Agents" subtitle="By revenue this period">
      {agents.length ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-xs font-medium uppercase text-gray-500 dark:border-gray-700 dark:text-gray-400">
                <th className="pb-2 pr-4">#</th>
                <th className="pb-2 pr-4">Agent</th>
                <th className="pb-2 pr-4 text-right">Leads Won</th>
                <th className="pb-2 pr-4 text-right">Total Leads</th>
                <th className="pb-2 text-right">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {agents.map((agent, idx) => (
                <tr
                  key={agent.agentId}
                  className="border-b border-gray-100 last:border-0 dark:border-gray-700/50"
                >
                  <td className="py-2 pr-4 text-gray-400">{idx + 1}</td>
                  <td className="py-2 pr-4 font-medium text-gray-700 dark:text-gray-300">
                    {agent.agentId.slice(0, 8)}...
                  </td>
                  <td className="py-2 pr-4 text-right text-green-600 dark:text-green-400">
                    {agent.leadsWon}
                  </td>
                  <td className="py-2 pr-4 text-right text-gray-600 dark:text-gray-400">
                    {agent.totalLeads}
                  </td>
                  <td className="py-2 text-right font-medium text-gray-800 dark:text-gray-200">
                    {formatCurrency(agent.revenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="py-8 text-center text-sm text-gray-400">No agent data available</p>
      )}
    </ChartCard>
  )
}
