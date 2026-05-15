// Design tokens — shared across admin-ui dashboard components

export const STATUS_COLORS: Record<string, string> = {
  NEW: '#6366f1',
  CONTACTED: '#3b82f6',
  QUALIFIED: '#8b5cf6',
  PROPOSAL: '#f97316',
  NEGOTIATION: '#f59e0b',
  WON: '#22c55e',
  LOST: '#ef4444',
}

export const STATUS_LABELS: Record<string, string> = {
  NEW: 'New',
  CONTACTED: 'Contacted',
  QUALIFIED: 'Qualified',
  PROPOSAL: 'Proposal',
  NEGOTIATION: 'Negotiation',
  WON: 'Won',
  LOST: 'Lost',
}

export function formatStatus(s: string): string {
  return STATUS_LABELS[s] ?? s.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
}

export function formatLabel(s: string): string {
  return s.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
}

export const CHART_TOOLTIP_STYLE = {
  backgroundColor: 'rgba(17, 24, 39, 0.9)',
  border: 'none',
  borderRadius: '8px',
  color: '#f9fafb',
  fontSize: '12px',
} as const

export const PROPERTY_STATUS_COLORS: Record<string, string> = {
  AVAILABLE: '#22c55e',
  RESERVED: '#f59e0b',
  SOLD: '#6366f1',
  RENTED: '#8b5cf6',
  OFF_MARKET: '#6b7280',
}

export const ACTIVITY_TYPE_ICONS: Record<string, string> = {
  PROPERTY_CREATED: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
  LEAD_CREATED: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  LEAD_WON: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  LEAD_LOST: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  CONTRACT_SIGNED: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  INVOICE_PAID: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  CLIENT_CREATED: 'bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400',
}

export const CHART_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6']