import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import { Button, Modal } from '../components/ui'
import { LeadFilters, LeadTable, LeadKanban, LeadDetailPanel, LeadForm } from '../components/leads'
import { leadsApi } from '../api/leads'
import { useDebounce } from '../hooks/useDebounce'
import { useLocalStorage } from '../hooks/useLocalStorage'
import type { LeadStatus } from '../types'
import { leadsKeys } from '../querykeys'

type ViewMode = 'table' | 'kanban'

export default function LeadsPage() {
  const [viewMode, setViewMode] = useLocalStorage<ViewMode>('leads-view', 'table')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState<'createdAt' | 'priority' | 'nextFollowUp'>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null)

  const debouncedSearch = useDebounce(search, 300)
  const queryClient = useQueryClient()

  const { data: leadsData, isLoading } = useQuery({
    queryKey: leadsKeys.list({ page, limit: 20, search: debouncedSearch, status: statusFilter, priority: priorityFilter, sortBy, sortOrder }),
    queryFn: () => leadsApi.list({ page, limit: 20, search: debouncedSearch, status: statusFilter, priority: priorityFilter, sortBy, sortOrder }),
  })

  const { data: pipeline, isLoading: pipelineLoading } = useQuery({
    queryKey: leadsKeys.pipeline(),
    queryFn: () => leadsApi.pipeline(),
    enabled: viewMode === 'kanban',
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: LeadStatus }) => leadsApi.changeStatus(id, status),
    onSuccess: () => {
      toast.success('Status updated')
      queryClient.invalidateQueries({ queryKey: leadsKeys.all })
    },
    onError: () => toast.error('Failed to change status'),
  })

  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortOrder((p) => (p === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(key as 'createdAt' | 'priority' | 'nextFollowUp')
      setSortOrder('asc')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Leads</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Track and manage your leads pipeline.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 transition-colors ${viewMode === 'table' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
              title="Table view"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3h18M3 12h18M3 21h18" /></svg>
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-2 transition-colors ${viewMode === 'kanban' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
              title="Kanban view"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="6" height="18" /><rect x="9" y="3" width="6" height="18" /><rect x="15" y="3" width="6" height="18" /></svg>
            </button>
          </div>
          <Button leftIcon={<Plus size={16} />} onClick={() => setShowCreateModal(true)}>New Lead</Button>
        </div>
      </div>

      {viewMode === 'table' ? (
        <>
          <LeadFilters search={search} onSearchChange={setSearch} status={statusFilter} onStatusChange={setStatusFilter} priority={priorityFilter} onPriorityChange={setPriorityFilter} />
          <LeadTable data={leadsData?.data ?? []} loading={isLoading} page={page} totalPages={leadsData?.totalPages ?? 1} onPageChange={setPage} sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} onRowClick={(lead) => setSelectedLeadId(lead.id)} />
        </>
      ) : (
        <LeadKanban pipeline={pipeline ?? null} loading={pipelineLoading} onLeadClick={(lead) => setSelectedLeadId(lead.id)} onStatusChange={(id, status) => statusMutation.mutate({ id, status })} />
      )}

      <Modal open={showCreateModal} onClose={() => setShowCreateModal(false)} title="New Lead">
        <LeadForm onSuccess={() => { setShowCreateModal(false); queryClient.invalidateQueries({ queryKey: leadsKeys.all }) }} onCancel={() => setShowCreateModal(false)} />
      </Modal>

      {selectedLeadId && (
        <LeadDetailPanel leadId={selectedLeadId} onClose={() => setSelectedLeadId(null)} onUpdated={() => queryClient.invalidateQueries({ queryKey: leadsKeys.all })} />
      )}
    </div>
  )
}