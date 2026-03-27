import { cn } from '../../utils'
import { LeadStatusBadge } from './LeadStatusBadge'
import { Badge } from '../ui/Badge'
import { LoadingSpinner } from '../ui/LoadingSpinner'
import type { Lead, LeadStatus } from '../../types'

interface LeadKanbanProps {
  pipeline: Record<string, Lead[]> | null
  loading: boolean
  onLeadClick: (lead: Lead) => void
  onStatusChange: (leadId: string, newStatus: LeadStatus) => void
}

const STATUSES: { key: LeadStatus; label: string; color: string }[] = [
  { key: 'NEW', label: 'New', color: 'border-t-blue-500' },
  { key: 'CONTACTED', label: 'Contacted', color: 'border-t-indigo-500' },
  { key: 'QUALIFIED', label: 'Qualified', color: 'border-t-purple-500' },
  { key: 'PROPOSAL', label: 'Proposal', color: 'border-t-orange-500' },
  { key: 'NEGOTIATION', label: 'Negotiation', color: 'border-t-yellow-500' },
  { key: 'WON', label: 'Won', color: 'border-t-green-500' },
  { key: 'LOST', label: 'Lost', color: 'border-t-red-500' },
]

const VALID_TRANSITIONS: Record<LeadStatus, LeadStatus[]> = {
  NEW: ['CONTACTED', 'LOST'],
  CONTACTED: ['QUALIFIED', 'LOST'],
  QUALIFIED: ['PROPOSAL', 'LOST'],
  PROPOSAL: ['NEGOTIATION', 'LOST'],
  NEGOTIATION: ['WON', 'LOST'],
  WON: [],
  LOST: ['NEW'],
}

export function LeadKanban({ pipeline, loading, onLeadClick, onStatusChange }: LeadKanbanProps) {
  if (loading) return <LoadingSpinner message="Loading pipeline..." />

  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {STATUSES.map((s) => {
        const leads = pipeline?.[s.key] ?? []
        return (
          <div
            key={s.key}
            className={cn(
              'flex-shrink-0 w-64 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50',
              'border-t-4',
              s.color,
            )}
          >
            <div className="px-3 py-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{s.label}</h3>
              <span className="text-xs text-gray-500 bg-gray-200 dark:bg-gray-700 rounded-full px-2 py-0.5">
                {leads.length}
              </span>
            </div>
            <div className="px-2 pb-2 flex flex-col gap-2 max-h-[60vh] overflow-y-auto">
              {leads.map((lead) => (
                <div
                  key={lead.id}
                  onClick={() => onLeadClick(lead)}
                  className="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 cursor-pointer hover:shadow-md transition-shadow"
                >
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {lead.client ? `${lead.client.firstName} ${lead.client.lastName}` : 'Unknown'}
                  </p>
                  {lead.property && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                      {lead.property.title}
                    </p>
                  )}
                  <div className="flex items-center gap-1 mt-2">
                    <LeadStatusBadge status={lead.status} />
                    <Badge variant={lead.priority === 'URGENT' ? 'red' : lead.priority === 'HIGH' ? 'orange' : 'gray'}>
                      {lead.priority}
                    </Badge>
                  </div>
                  {VALID_TRANSITIONS[lead.status].length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {VALID_TRANSITIONS[lead.status].map((nextStatus) => (
                        <button
                          key={nextStatus}
                          onClick={(e) => {
                            e.stopPropagation()
                            onStatusChange(lead.id, nextStatus)
                          }}
                          className="text-[10px] px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-indigo-100 hover:text-indigo-700 dark:hover:bg-indigo-900/30 dark:hover:text-indigo-400 transition-colors"
                        >
                          → {nextStatus}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
