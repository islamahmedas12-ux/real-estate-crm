import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserCog, Search, Users, Building2, FileText, CheckCircle, XCircle } from 'lucide-react'
import { Skeleton } from '../../components/ui'
import { useAgentsList } from '../../hooks/useAgents'
import { getInitials } from '../../utils'

export default function AgentsListPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const limit = 10

  const { data, isLoading } = useAgentsList({ page, limit, search: search || undefined })

  const agents = data?.data ?? []
  const total = data?.total ?? 0
  const totalPages = data?.totalPages ?? 1

  function fullName(agent: { firstName: string | null; lastName: string | null; email: string }) {
    if (agent.firstName || agent.lastName) {
      return `${agent.firstName ?? ''} ${agent.lastName ?? ''}`.trim()
    }
    return agent.email
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <UserCog size={24} className="text-indigo-500" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Agents</h1>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
              Manage agents and view workload overview
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search agents by name or email..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm text-gray-800 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:placeholder-gray-500"
        />
      </div>

      {/* Agent Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800"
            >
              <Skeleton height="h-24" />
            </div>
          ))}
        </div>
      ) : agents.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white py-16 dark:border-gray-700 dark:bg-gray-800">
          <UserCog size={40} className="text-gray-300 dark:text-gray-600" />
          <p className="mt-3 text-gray-500 dark:text-gray-400">No agents found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {agents.map((agent) => {
            const name = fullName(agent)
            const counts = agent._count
            return (
              <div
                key={agent.id}
                onClick={() => navigate(`/agents/${agent.id}`)}
                className="cursor-pointer rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:border-indigo-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-indigo-600"
              >
                {/* Agent Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400">
                      {getInitials(name)}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 dark:text-gray-200">{name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{agent.email}</p>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                      agent.isActive
                        ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}
                  >
                    {agent.isActive ? <CheckCircle size={12} /> : <XCircle size={12} />}
                    {agent.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* Workload Stats */}
                {counts && (
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-700/50">
                      <Building2 size={14} className="text-indigo-500" />
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Properties</p>
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                          {counts.assignedProperties}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-700/50">
                      <Users size={14} className="text-green-500" />
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Clients</p>
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                          {counts.assignedClients}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-700/50">
                      <FileText size={14} className="text-amber-500" />
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Leads</p>
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                          {counts.assignedLeads}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Last Login */}
                <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
                  {agent.lastLoginAt
                    ? `Last login: ${new Date(agent.lastLoginAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}`
                    : 'Never logged in'}
                </p>
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <p>
            Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total} agents
          </p>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700"
            >
              Previous
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
