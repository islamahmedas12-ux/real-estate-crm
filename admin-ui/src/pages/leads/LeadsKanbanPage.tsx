import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserCheck, Plus, List, GripVertical } from 'lucide-react'
import { Button, LoadingSpinner } from '../../components/ui'
import { useLeadPipeline, useChangeLeadStatus } from '../../hooks/useLeads'
import { formatDate, formatCurrency, cn } from '../../utils'
import toast from 'react-hot-toast'
import type { Lead, LeadStatus } from '../../types/lead'

const PIPELINE_STAGES: { status: LeadStatus; label: string; color: string; bg: string }[] = [
  { status: 'NEW', label: 'New', color: 'border-gray-300 dark:border-gray-600', bg: 'bg-gray-50 dark:bg-gray-800/50' },
  { status: 'CONTACTED', label: 'Contacted', color: 'border-blue-300 dark:border-blue-700', bg: 'bg-blue-50/50 dark:bg-blue-900/10' },
  { status: 'QUALIFIED', label: 'Qualified', color: 'border-indigo-300 dark:border-indigo-700', bg: 'bg-indigo-50/50 dark:bg-indigo-900/10' },
  { status: 'PROPOSAL', label: 'Proposal', color: 'border-purple-300 dark:border-purple-700', bg: 'bg-purple-50/50 dark:bg-purple-900/10' },
  { status: 'NEGOTIATION', label: 'Negotiation', color: 'border-amber-300 dark:border-amber-700', bg: 'bg-amber-50/50 dark:bg-amber-900/10' },
  { status: 'WON', label: 'Won', color: 'border-green-300 dark:border-green-700', bg: 'bg-green-50/50 dark:bg-green-900/10' },
  { status: 'LOST', label: 'Lost', color: 'border-red-300 dark:border-red-700', bg: 'bg-red-50/50 dark:bg-red-900/10' },
]

const priorityDot: Record<string, string> = {
  LOW: 'bg-gray-400',
  MEDIUM: 'bg-blue-500',
  HIGH: 'bg-amber-500',
  URGENT: 'bg-red-500',
}

export default function LeadsKanbanPage({ embedded = false }: { embedded?: boolean }) {
  const navigate = useNavigate()
  const { data: pipeline, isLoading } = useLeadPipeline()
  const changeStatus = useChangeLeadStatus()
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null)
  const [dragOverStage, setDragOverStage] = useState<LeadStatus | null>(null)

  function handleDragStart(e: React.DragEvent, lead: Lead) {
    setDraggedLead(lead)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', lead.id)
  }

  function handleDragOver(e: React.DragEvent, status: LeadStatus) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverStage(status)
  }

  function handleDragLeave() {
    setDragOverStage(null)
  }

  async function handleDrop(e: React.DragEvent, newStatus: LeadStatus) {
    e.preventDefault()
    setDragOverStage(null)
    if (!draggedLead || draggedLead.status === newStatus) {
      setDraggedLead(null)
      return
    }

    try {
      await changeStatus.mutateAsync({
        id: draggedLead.id,
        data: { status: newStatus, notes: `Moved to ${newStatus} via kanban` },
      })
      toast.success(`Lead moved to ${newStatus}`)
    } catch {
      toast.error('Failed to change lead status')
    }
    setDraggedLead(null)
  }

  if (isLoading) return <LoadingSpinner message="Loading pipeline..." />

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Header — hidden when embedded */}
      {!embedded && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UserCheck size={24} className="text-indigo-500" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Lead Pipeline</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<List size={16} />}
              onClick={() => navigate('/leads')}
            >
              List View
            </Button>
            <Button leftIcon={<Plus size={16} />} onClick={() => navigate('/leads/new')}>
              Add Lead
            </Button>
          </div>
        </div>
      )}

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4 min-h-[500px]">
        {PIPELINE_STAGES.map((stage) => {
          const leads = (pipeline?.[stage.status] ?? []) as Lead[]
          const isOver = dragOverStage === stage.status

          return (
            <div
              key={stage.status}
              className={cn(
                'flex flex-col w-72 min-w-[18rem] shrink-0 rounded-xl border-2 transition-colors',
                stage.color,
                isOver && 'border-indigo-500 dark:border-indigo-400 shadow-lg',
              )}
              onDragOver={(e) => handleDragOver(e, stage.status)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, stage.status)}
            >
              {/* Stage Header */}
              <div className={cn('flex items-center justify-between px-4 py-3 rounded-t-xl', stage.bg)}>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {stage.label}
                </h3>
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white dark:bg-gray-700 text-xs font-bold text-gray-600 dark:text-gray-300 shadow-sm">
                  {leads.length}
                </span>
              </div>

              {/* Cards */}
              <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-260px)]">
                {leads.map((lead) => (
                  <div
                    key={lead.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, lead)}
                    onClick={() => navigate(`/leads/${lead.id}`)}
                    className={cn(
                      'group rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 cursor-pointer',
                      'hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-600 transition-all',
                      draggedLead?.id === lead.id && 'opacity-40',
                    )}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-tight">
                        {lead.client
                          ? `${lead.client.firstName} ${lead.client.lastName}`
                          : 'Unknown'}
                      </span>
                      <GripVertical
                        size={14}
                        className="text-gray-300 dark:text-gray-600 shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      />
                    </div>

                    {lead.property && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 truncate">
                        {lead.property.title}
                      </p>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className={cn('w-2 h-2 rounded-full', priorityDot[lead.priority])} />
                        <span className="text-[10px] text-gray-400 uppercase">{lead.priority}</span>
                      </div>
                      {lead.budget && (
                        <span className="text-[10px] font-medium text-gray-500">
                          {formatCurrency(lead.budget)}
                        </span>
                      )}
                    </div>

                    {lead.nextFollowUp && (
                      <p className="mt-2 text-[10px] text-gray-400">
                        Follow-up: {formatDate(lead.nextFollowUp)}
                      </p>
                    )}
                  </div>
                ))}

                {leads.length === 0 && (
                  <div className="flex items-center justify-center h-24 text-xs text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                    No leads
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
