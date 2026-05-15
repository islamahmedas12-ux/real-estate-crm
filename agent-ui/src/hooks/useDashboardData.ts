import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  fetchAgentOverview,
  fetchAgentLeadsPipeline,
  fetchAgentFollowUps,
  fetchAgentPerformance,
} from '../api/dashboard'
import type { AgentLeadsPipeline } from '../api/dashboard'
import { PIPELINE_COLORS, PIPELINE_LABELS } from '../components/dashboard/tokens'

const agentKeys = {
  overview: ['agent', 'overview'] as const,
  pipeline: ['agent', 'pipeline'] as const,
  followUps: ['agent', 'follow-ups'] as const,
  performance: ['agent', 'performance'] as const,
}

export function useAgentOverview() {
  return useQuery({
    queryKey: agentKeys.overview,
    queryFn: fetchAgentOverview,
    staleTime: 60_000,
  })
}

export function useAgentPipeline() {
  return useQuery({
    queryKey: agentKeys.pipeline,
    queryFn: fetchAgentLeadsPipeline,
    staleTime: 60_000,
  })
}

export function useAgentFollowUps() {
  return useQuery({
    queryKey: agentKeys.followUps,
    queryFn: fetchAgentFollowUps,
    staleTime: 60_000,
  })
}

export function useAgentPerformance() {
  return useQuery({
    queryKey: agentKeys.performance,
    queryFn: fetchAgentPerformance,
    staleTime: 60_000,
  })
}

export function usePipelineChartData(pipeline: AgentLeadsPipeline | undefined) {
  return useMemo(() => {
    if (!pipeline) return { barData: [], pieData: [] };
    const barData = pipeline.pipeline
      .filter((s) => s.status !== 'LOST')
      .map((s) => ({
        name: PIPELINE_LABELS[s.status] ?? s.status,
        count: s.count,
        fill: PIPELINE_COLORS[s.status] ?? '#6b7280',
      }));
    const pieData = pipeline.pipeline.map((s) => ({
      name: PIPELINE_LABELS[s.status] ?? s.status,
      value: s.count,
      fill: PIPELINE_COLORS[s.status] ?? '#6b7280',
    }));
    return { barData, pieData };
  }, [pipeline]);
}
