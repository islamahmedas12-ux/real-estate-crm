import { useState, useEffect } from 'react'
import { X, User, Building2, Calendar, Clock, Tag } from 'lucide-react'
import toast from 'react-hot-toast'
import { cn, formatDate, formatCurrency } from '../../utils'
import { Badge, LoadingSpinner, Select } from '../ui'
import { LeadStatusBadge } from './LeadStatusBadge'
import { LeadActivityForm } from './LeadActivityForm'
import { leadsApi } from '../../api/leads'
import type { Lead, LeadActivity, LeadStatus } from '../../types'

interface LeadDetailPanelProps {
  leadId: string
  onClose: () => void
  onUpdated: () => void
}

const VALID_TRANSITIONS: Record<LeadStatus, LeadStatus[]> = {
  NEW: ['CONTACTED', 'LOST'],
  CONTACTED: ['QUALIFIED', 'LOST'],
  QUALIFIED: ['PROPOSAL', 'LOST'],
  PROPOSAL: ['NEGOTIATION', 'LOST'],
  NEGOTIATION: ['WON', 'LOST'],
  WON: [],
  LOST: ['NEW'],
}

export function LeadDetailPanel({ leadId, onClose, onUpdated }: LeadDetailPanelProps) {
  const [lead, setLead] = useState<Lead | null>(null)
  const [activities, setActivities] = useState<LeadActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [statusChanging, setStatusChanging] = useState(false)

  const fetchLead = async () => {
    try {
      const [leadData, actData] = await Promise.all([
        leadsApi.get(leadId),
        leadsApi.getActivities(leadId, { limit: 20 }),
      ])
      setLead(leadData)
      setActivities(actData.data)
    } catch {
      toast.error('Failed to load lead details')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLead()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId])

  const handleStatusChange = async (newStatus: string) => {
    setStatusChanging(true)
    try {
      await leadsApi.changeStatus(leadId, newStatus)
      toast.success(`Status changed to ${newStatus}`)
      await fetchLead()
      onUpdated()
    } catch {
      toast.error('Failed to change status')
    } finally {
      setStatusChanging(false)
    }
  }

  if (loading) return <SlideOver onClose={onClose}><LoadingSpinner /></SlideOver>
  if (!lead) return null

  const transitions = VALID_TRANSITIONS[lead.status] ?? []

  return (
    <SlideOver onClose={onClose}>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Lead Details</h2>
            <div className="flex items-center gap-2 mt-1">
              <LeadStatusBadge status={lead.status} />
              <Badge variant={lead.priority === 'URGENT' ? 'red' : lead.priority === 'HIGH' ? 'orange' : 'gray'}>
                {lead.priority}
              </Badge>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Status Change */}
        {transitions.length > 0 && (
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
              Change Status
            </label>
            <div className="flex gap-2">
              <Select
                options={transitions.map((s) => ({ value: s, label: s }))}
                placeholder="Select status..."
                onChange={(e) => { if (e.target.value) handleStatusChange(e.target.value) }}
                disabled={statusChanging}
              />
            </div>
          </div>
        )}

        {/* Client Info */}
        {lead.client && (
          <InfoSection icon={User} title="Client">
            <p className="text-sm text-gray-900 dark:text-gray-100">{lead.client.firstName} {lead.client.lastName}</p>
            {lead.client.email && <p className="text-xs text-gray-500">{lead.client.email}</p>}
            <p className="text-xs text-gray-500">{lead.client.phone}</p>
          </InfoSection>
        )}

        {/* Property Info */}
        {lead.property && (
          <InfoSection icon={Building2} title="Property">
            <p className="text-sm text-gray-900 dark:text-gray-100">{lead.property.title}</p>
            <p className="text-xs text-gray-500">{formatCurrency(lead.property.price)}</p>
          </InfoSection>
        )}

        {/* Lead Details */}
        <InfoSection icon={Tag} title="Details">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-gray-500">Source</span>
            <span className="text-gray-900 dark:text-gray-100">{lead.source.replace(/_/g, ' ')}</span>
            {lead.budget != null && (
              <>
                <span className="text-gray-500">Budget</span>
                <span className="text-gray-900 dark:text-gray-100">{formatCurrency(lead.budget)}</span>
              </>
            )}
            <span className="text-gray-500">Created</span>
            <span className="text-gray-900 dark:text-gray-100">{formatDate(lead.createdAt)}</span>
          </div>
        </InfoSection>

        {lead.nextFollowUp && (
          <InfoSection icon={Calendar} title="Next Follow-up">
            <p className="text-sm text-gray-900 dark:text-gray-100">{formatDate(lead.nextFollowUp)}</p>
          </InfoSection>
        )}

        {lead.notes && (
          <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
            {lead.notes}
          </div>
        )}

        {/* Log Activity */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Log Activity</h3>
          <LeadActivityForm leadId={leadId} onSuccess={fetchLead} />
        </div>

        {/* Activity Timeline */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Recent Activity</h3>
          {activities.length === 0 ? (
            <p className="text-sm text-gray-400">No activities yet.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {activities.map((a) => (
                <div key={a.id} className="flex gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <Clock size={14} className="text-gray-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="gray">{a.type}</Badge>
                      <span className="text-xs text-gray-400">{formatDate(a.createdAt)}</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{a.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </SlideOver>
  )
}

function InfoSection({ icon: Icon, title, children }: { icon: React.ComponentType<{ size?: number; className?: string }>; title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
        <Icon size={14} className="text-gray-400" />
        {title}
      </h3>
      <div className="pl-5">{children}</div>
    </div>
  )
}

function SlideOver({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div
        className={cn(
          'relative w-full max-w-md bg-white dark:bg-gray-800 shadow-xl',
          'border-l border-gray-200 dark:border-gray-700',
          'overflow-y-auto p-6',
        )}
      >
        {children}
      </div>
    </div>
  )
}
