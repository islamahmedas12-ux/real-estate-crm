import { useState, useEffect, useCallback } from 'react'
import { Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import { Button, Modal } from '../components/ui'
import {
  ClientFilters,
  ClientTable,
  ClientDetailPanel,
  ClientForm,
} from '../components/clients'
import { clientsApi } from '../api/clients'
import type { ClientListParams } from '../api/clients'
import { useDebounce } from '../hooks/useDebounce'
import type { Client } from '../types'

export default function ClientsPage() {
  // Filters
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [sourceFilter, setSourceFilter] = useState('')
  const debouncedSearch = useDebounce(search, 300)

  // Table state
  const [data, setData] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [sortBy, setSortBy] = useState<string>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Modals / panels
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)

  // ── Fetch data ────────────────────────────────────────────────────
  const fetchClients = useCallback(async () => {
    setLoading(true)
    try {
      const params: ClientListParams = {
        page,
        limit: 20,
        search: debouncedSearch || undefined,
        type: typeFilter || undefined,
        source: sourceFilter || undefined,
        sortBy: sortBy as ClientListParams['sortBy'],
        sortOrder,
      }
      const result = await clientsApi.list(params)
      setData(result.data)
      setTotalPages(result.totalPages)
    } catch {
      toast.error('Failed to load clients')
    } finally {
      setLoading(false)
    }
  }, [page, debouncedSearch, typeFilter, sourceFilter, sortBy, sortOrder])

  useEffect(() => {
    fetchClients()
  }, [fetchClients])

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, typeFilter, sourceFilter])

  // ── Handlers ──────────────────────────────────────────────────────
  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(key)
      setSortOrder('asc')
    }
  }

  const handleRowClick = (client: Client) => {
    setSelectedClientId(client.id)
  }

  const handleClientCreated = () => {
    setShowCreateModal(false)
    fetchClients()
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Clients</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            View and manage your client relationships.
          </p>
        </div>
        <Button leftIcon={<Plus size={16} />} onClick={() => setShowCreateModal(true)}>
          New Client
        </Button>
      </div>

      {/* Filters */}
      <ClientFilters
        search={search}
        onSearchChange={setSearch}
        type={typeFilter}
        onTypeChange={setTypeFilter}
        source={sourceFilter}
        onSourceChange={setSourceFilter}
      />

      {/* Table */}
      <ClientTable
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

      {/* Create Client Modal */}
      <Modal open={showCreateModal} onClose={() => setShowCreateModal(false)} title="New Client">
        <ClientForm onSuccess={handleClientCreated} onCancel={() => setShowCreateModal(false)} />
      </Modal>

      {/* Client Detail Panel */}
      {selectedClientId && (
        <ClientDetailPanel
          clientId={selectedClientId}
          onClose={() => setSelectedClientId(null)}
        />
      )}
    </div>
  )
}
