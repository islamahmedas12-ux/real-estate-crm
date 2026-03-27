import { useState, useEffect, useCallback } from 'react'
import { Plus, LayoutGrid, List } from 'lucide-react'
import toast from 'react-hot-toast'
import { Button, Modal } from '../components/ui'
import {
  LeadFilters,
  LeadTable,
  LeadKanban,
  LeadDetailPanel,
  LeadForm,
} from '../components/leads'
import { leadsApi } from '../api/leads'
import type { LeadListParams } from '../api/leads'
import { useDebounce } from '../hooks/useDebounce'
import { useLocalStorage } from '../hooks/useLocalStorage'
import type { Lead, LeadStatus } from '../types'

type ViewMode = 'table' | 'kanban'

export default function LeadsPage() {
  // View mode
  const [viewMode, setViewMode] = useLocalStorage<ViewMode>('leads-view', 'table')

  // Filters
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const debouncedSearch = useDebounce(search, 300)

  // Table state
  const [data, setData] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [sortBy, setSortBy] = useState<string>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Kanban state
  const [pipeline, setPipeline] = useState<Record<string, Lead[]> | null>(null)
  const [kanbanLoading, setKanbanLoading] = useState(false)

  // Modals / panels
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null)

  // ── Fetch table data ──────────────────────────────────────────────
  const fetchLeads = useCallback(async () => {
    setLoading(true)
    try {
      const params: LeadListParams = {
        page,
        limit: 20,
        search: debouncedSearch || undefined,
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        sortBy: sortBy as LeadListParams['sortBy'],
        sortOrder,
      }
      const result = await leadsApi.list(params)
      setData(result.data)
      setTotalPages(result.totalPages)
    } catch {
      toast.error('Failed to load leads')
    } finally {
      setLoading(false)
    }
  }, [page, debouncedSearch, statusFilter, priorityFilter, sortBy, sortOrder])

  // ── Fetch pipeline (kanban) ───────────────────────────────────────
  const fetchPipeline = useCallback(async () => {
    setKanbanLoading(true)
    try {
      const result = await leadsApi.pipeline()
      setPipeline(result)
    } catch {
      toast.error('Failed to load pipeline')
    } finally {
      setKanbanLoading(false)
    }
  }, [])

  useEffect(() => {
    if (viewMode === 'table') {
      fetchLeads()
    } else {
      fetchPipeline()
    }
  }, [viewMode, fetchLeads, fetchPipeline])

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, statusFilter, priorityFilter])

  // ── Handlers ──────────────────────────────────────────────────────
  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(key)
      setSortOrder('asc')
    }
  }

  const handleRowClick = (lead: Lead) => {
    setSelectedLeadId(lead.id)
  }

  const handleLeadCreated = () => {
    setShowCreateModal(false)
    if (viewMode === 'table') {
      fetchLeads()
    } else {
      fetchPipeline()
    }
  }

  const handleDetailUpdated = () => {
    if (viewMode === 'table') {
      fetchLeads()
    } else {
      fetchPipeline()
    }
  }

  const handleKanbanStatusChange = async (leadId: string, newStatus: LeadStatus) => {
    try {
      await leadsApi.changeStatus(leadId, newStatus)
      toast.success(`Status changed to ${newStatus}`)
      fetchPipeline()
    } catch {
      toast.error('Failed to change status')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Leads</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Track and manage your leads pipeline.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 transition-colors ${
                viewMode === 'table'
                  ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
              title="Table view"
            >
              <List size={18} />
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-2 transition-colors ${
                viewMode === 'kanban'
                  ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
              title="Kanban view"
            >
              <LayoutGrid size={18} />
            </button>
          </div>
          <Button leftIcon={<Plus size={16} />} onClick={() => setShowCreateModal(true)}>
            New Lead
          </Button>
        </div>
      </div>

      {/* Filters (table mode only) */}
      {viewMode === 'table' && (
        <LeadFilters
          search={search}
          onSearchChange={setSearch}
          status={statusFilter}
          onStatusChange={setStatusFilter}
          priority={priorityFilter}
          onPriorityChange={setPriorityFilter}
        />
      )}

      {/* Content */}
      {viewMode === 'table' ? (
        <LeadTable
          data={data}
          loading={loading}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          onRowClick={handleRowClick}
        />
      ) : (
        <LeadKanban
          pipeline={pipeline}
          loading={kanbanLoading}
          onLeadClick={handleRowClick}
          onStatusChange={handleKanbanStatusChange}
        />
      )}

      {/* Create Lead Modal */}
      <Modal open={showCreateModal} onClose={() => setShowCreateModal(false)} title="New Lead">
        <LeadForm onSuccess={handleLeadCreated} onCancel={() => setShowCreateModal(false)} />
      </Modal>

      {/* Lead Detail Panel */}
      {selectedLeadId && (
        <LeadDetailPanel
          leadId={selectedLeadId}
          onClose={() => setSelectedLeadId(null)}
          onUpdated={handleDetailUpdated}
        />
      )}
    </div>
  )
}
