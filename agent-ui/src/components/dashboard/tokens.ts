// Design tokens for dashboard — extracted from DashboardPage.tsx

export const PIPELINE_COLORS: Record<string, string> = {
  NEW: '#3b82f6',
  CONTACTED: '#f59e0b',
  QUALIFIED: '#8b5cf6',
  PROPOSAL: '#ec4899',
  NEGOTIATION: '#f97316',
  WON: '#22c55e',
  LOST: '#ef4444',
};

export const PIPELINE_LABELS: Record<string, string> = {
  NEW: 'New',
  CONTACTED: 'Contacted',
  QUALIFIED: 'Qualified',
  PROPOSAL: 'Proposal',
  NEGOTIATION: 'Negotiation',
  WON: 'Won',
  LOST: 'Lost',
};

export const PRIORITY_BADGE: Record<string, string> = {
  URGENT: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
  HIGH: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400',
  MEDIUM: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  LOW: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
};
