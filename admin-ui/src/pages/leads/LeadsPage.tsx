import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserCheck, Plus, LayoutGrid, List } from 'lucide-react'
import { Button } from '../../components/ui'
import LeadsListPage from './LeadsListPage'
import LeadsKanbanPage from './LeadsKanbanPage'

export type ViewMode = 'list' | 'kanban'

export default function LeadsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const navigate = useNavigate()

  return (
    <div className="flex flex-col gap-6">
      {/* Shared Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <UserCheck size={24} className="text-indigo-500" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Leads</h1>
        </div>
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex items-center rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-0.5">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              <List size={14} /> List
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                viewMode === 'kanban'
                  ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              <LayoutGrid size={14} /> Kanban
            </button>
          </div>
          <Button leftIcon={<Plus size={16} />} onClick={() => navigate('/leads/new')}>
            Add Lead
          </Button>
        </div>
      </div>

      {/* View Content */}
      {viewMode === 'list' ? <LeadsListPage /> : <LeadsKanbanPage />}
    </div>
  )
}
