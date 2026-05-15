import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { Button, Modal } from '../components/ui'
import { ClientFilters, ClientTable, ClientDetailPanel, ClientForm } from '../components/clients'
import { clientsApi } from '../api/clients'
import { useDebounce } from '../hooks/useDebounce'
import type { Client } from '../types'
import { clientsKeys } from '../querykeys'

export default function ClientsPage() {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [sourceFilter, setSourceFilter] = useState('')
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState<string>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)

  const debouncedSearch = useDebounce(search, 300)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: clientsKeys.list({ page, limit: 20, search: debouncedSearch, type: typeFilter, source: sourceFilter, sortBy, sortOrder }),
    queryFn: () => clientsApi.list({ page, limit: 20, search: debouncedSearch, type: typeFilter, source: sourceFilter, sortBy, sortOrder } as import('../api/clients').ClientListParams),
  })

  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortOrder((p) => (p === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(key)
      setSortOrder('asc')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Clients</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">View and manage your client relationships.</p>
        </div>
        <Button leftIcon={<Plus size={16} />} onClick={() => setShowCreateModal(true)}>New Client</Button>
      </div>

      <ClientFilters search={search} onSearchChange={setSearch} type={typeFilter} onTypeChange={setTypeFilter} source={sourceFilter} onSourceChange={setSourceFilter} />

      <ClientTable
        data={data?.data ?? []}
        loading={isLoading}
        page={page}
        totalPages={data?.totalPages ?? 1}
        onPageChange={setPage}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
        onRowClick={(client: Client) => setSelectedClientId(client.id)}
      />

      <Modal open={showCreateModal} onClose={() => setShowCreateModal(false)} title="New Client">
        <ClientForm onSuccess={() => { setShowCreateModal(false); queryClient.invalidateQueries({ queryKey: clientsKeys.list({ page, limit: 20, search: debouncedSearch, type: typeFilter, source: sourceFilter, sortBy, sortOrder }) }) }} onCancel={() => setShowCreateModal(false)} />
      </Modal>

      {selectedClientId && <ClientDetailPanel clientId={selectedClientId} onClose={() => setSelectedClientId(null)} />}
    </div>
  )
}