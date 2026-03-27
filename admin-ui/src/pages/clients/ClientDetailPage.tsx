import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Edit,
  Mail,
  Phone,
  User,
  Calendar,
  FileText,
  TrendingUp,
  Clock,
} from 'lucide-react'
import { Button, LoadingSpinner } from '../../components/ui'
import { useClientDetail, useClientHistory } from '../../hooks/useClients'
import { formatDate, formatCurrency } from '../../utils'

const statusColor: Record<string, string> = {
  NEW: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  CONTACTED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  QUALIFIED: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  PROPOSAL: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  NEGOTIATION: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  WON: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  LOST: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: client, isLoading, isError } = useClientDetail(id!)
  const { data: history } = useClientHistory(id!)

  if (isLoading) return <LoadingSpinner message="Loading client..." />
  if (isError || !client) {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <p className="text-gray-500">Client not found.</p>
        <Button variant="secondary" onClick={() => navigate('/clients')}>
          Back to Clients
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/clients')}
            className="rounded-lg p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {client.firstName} {client.lastName}
            </h1>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {client.type} &middot; {client.source?.replace('_', ' ')}
            </span>
          </div>
        </div>
        <Button
          leftIcon={<Edit size={16} />}
          onClick={() => navigate(`/clients/${id}/edit`)}
        >
          Edit Client
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info Card */}
        <div className="lg:col-span-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <User size={18} className="text-indigo-500" /> Client Info
          </h2>
          <dl className="space-y-3 text-sm">
            {client.email && (
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-gray-400 shrink-0" />
                <dd className="text-gray-700 dark:text-gray-300">{client.email}</dd>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Phone size={14} className="text-gray-400 shrink-0" />
              <dd className="text-gray-700 dark:text-gray-300">{client.phone}</dd>
            </div>
            {client.nationalId && (
              <div className="flex items-center gap-2">
                <FileText size={14} className="text-gray-400 shrink-0" />
                <dd className="text-gray-700 dark:text-gray-300">ID: {client.nationalId}</dd>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-gray-400 shrink-0" />
              <dd className="text-gray-700 dark:text-gray-300">Since {formatDate(client.createdAt)}</dd>
            </div>
            {client.assignedAgent && (
              <div className="flex items-center gap-2">
                <User size={14} className="text-gray-400 shrink-0" />
                <dd className="text-gray-700 dark:text-gray-300">Agent: {client.assignedAgent.name}</dd>
              </div>
            )}
            {client.notes && (
              <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                <dt className="text-xs font-medium text-gray-500 mb-1">Notes</dt>
                <dd className="text-gray-700 dark:text-gray-300 whitespace-pre-line">{client.notes}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Leads & Contracts */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Leads */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <TrendingUp size={18} className="text-indigo-500" /> Leads ({client.leads?.length ?? 0})
            </h2>
            {client.leads && client.leads.length > 0 ? (
              <div className="space-y-2">
                {client.leads.map((lead) => (
                  <Link
                    key={lead.id}
                    to={`/leads/${lead.id}`}
                    className="flex items-center justify-between rounded-lg border border-gray-100 dark:border-gray-700 p-3 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[lead.status] ?? ''}`}>
                        {lead.status}
                      </span>
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {lead.property?.title ?? 'No property'}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">{formatDate(lead.createdAt)}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No leads yet.</p>
            )}
          </div>

          {/* Contracts */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <FileText size={18} className="text-indigo-500" /> Contracts ({client.contracts?.length ?? 0})
            </h2>
            {client.contracts && client.contracts.length > 0 ? (
              <div className="space-y-2">
                {client.contracts.map((contract) => (
                  <Link
                    key={contract.id}
                    to={`/contracts/${contract.id}`}
                    className="flex items-center justify-between rounded-lg border border-gray-100 dark:border-gray-700 p-3 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-medium text-gray-500 uppercase">{contract.type}</span>
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {contract.property?.title ?? 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {formatCurrency(contract.totalAmount)}
                      </span>
                      <span className="text-xs text-gray-500">{contract.status}</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No contracts yet.</p>
            )}
          </div>

          {/* Activity History */}
          {history && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <Clock size={18} className="text-indigo-500" /> Activity History
              </h2>
              {[...history.leads, ...history.contracts].length > 0 ? (
                <div className="relative pl-6 border-l-2 border-gray-200 dark:border-gray-700 space-y-4">
                  {history.leads.map((lead) => (
                    <div key={`lead-${lead.id}`} className="relative">
                      <div className="absolute -left-[1.65rem] top-1 w-3 h-3 rounded-full bg-indigo-500" />
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        Lead created &mdash; {lead.status} priority {lead.priority}
                      </p>
                      <p className="text-xs text-gray-500">{formatDate(lead.createdAt)}</p>
                    </div>
                  ))}
                  {history.contracts.map((c) => (
                    <div key={`contract-${c.id}`} className="relative">
                      <div className="absolute -left-[1.65rem] top-1 w-3 h-3 rounded-full bg-green-500" />
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        Contract ({c.type}) &mdash; {formatCurrency(c.totalAmount)}
                      </p>
                      <p className="text-xs text-gray-500">{formatDate(c.createdAt)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">No activity history.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
