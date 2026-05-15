import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  fetchAgentOverview,
  fetchAgentLeadsPipeline,
  fetchAgentFollowUps,
  fetchAgentPerformance,
} from '../api/dashboard';
import type { AgentLeadsPipeline } from '../api/dashboard';
import { PIPELINE_COLORS, PIPELINE_LABELS } from '../components/dashboard/tokens';

export function useAgentOverview() {
  return useQuery({
    queryKey: ['agent-overview'],
    queryFn: fetchAgentOverview,
    staleTime: 60_000,
  });
}

export function useAgentPipeline() {
  return useQuery({
    queryKey: ['agent-leads-pipeline'],
    queryFn: fetchAgentLeadsPipeline,
    staleTime: 60_000,
  });
}

export function useAgentFollowUps() {
  return useQuery({
    queryKey: ['agent-follow-ups'],
    queryFn: fetchAgentFollowUps,
    staleTime: 60_000,
  });
}

export function useAgentPerformance() {
  return useQuery({
    queryKey: ['agent-performance'],
    queryFn: fetchAgentPerformance,
    staleTime: 60_000,
  });
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
