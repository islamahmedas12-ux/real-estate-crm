import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  UserCog,
  Building2,
  Users,
  FileText,
  TrendingUp,
  DollarSign,
  CheckCircle,
  XCircle,
  Mail,
  Calendar,
} from 'lucide-react'
import { Button, Skeleton } from '../../components/ui'
import { ChartCard } from '../../components/dashboard'
import { useAgentDetail } from '../../hooks/useAgents'
import { getInitials, formatCurrency } from '../../utils'

export default function AgentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: agent, isLoading } = useAgentDetail(id ?? '')

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton height="h-8" />
        <Skeleton height="h-40" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Skeleton height="h-64" />
          <Skeleton height="h-64" />
        </div>
      </div>
    )
  }

  if (!agent) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <UserCog size={48} className="text-gray-300 dark:text-gray-600" />
        <p className="mt-4 text-gray-500 dark:text-gray-400">Agent not found</p>
        <Button variant="secondary" className="mt-4" onClick={() => navigate('/agents')}>
          Back to Agents
        </Button>
      </div>
    )
  }

  const fullName =
    agent.firstName || agent.lastName
      ? `${agent.firstName ?? ''} ${agent.lastName ?? ''}`.trim()
      : agent.email

  const perf = agent.performance

  return (
    <div className="flex flex-col gap-6">
      {/* Back Link */}
      <button
        onClick={() => navigate('/agents')}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 w-fit"
      >
        <ArrowLeft size={16} />
        Back to Agents
      </button>

      {/* Agent Header */}
      <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 text-lg font-bold text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400">
            {getInitials(fullName)}
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{fullName}</h1>
            <div className="mt-1 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <Mail size={14} />
                {agent.email}
              </span>
              <span className="flex items-center gap-1">
                <Calendar size={14} />
                Joined {new Date(agent.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          </div>
        </div>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium w-fit ${
            agent.isActive
              ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
          }`}
        >
          {agent.isActive ? <CheckCircle size={14} /> : <XCircle size={14} />}
          {agent.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>

      {/* Performance Stats */}
      {perf && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-indigo-50 p-2 dark:bg-indigo-900/30">
                <FileText size={18} className="text-indigo-600 dark:text-indigo-400" />
              </div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Leads</p>
            </div>
            <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">{perf.totalLeads}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-green-50 p-2 dark:bg-green-900/30">
                <CheckCircle size={18} className="text-green-600 dark:text-green-400" />
              </div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Leads Won</p>
            </div>
            <p className="mt-2 text-2xl font-bold text-green-600 dark:text-green-400">{perf.leadsWon}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-sky-50 p-2 dark:bg-sky-900/30">
                <DollarSign size={18} className="text-sky-600 dark:text-sky-400" />
              </div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Revenue</p>
            </div>
            <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
              {formatCurrency(perf.revenue)}
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-amber-50 p-2 dark:bg-amber-900/30">
                <TrendingUp size={18} className="text-amber-600 dark:text-amber-400" />
              </div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Conversion Rate</p>
            </div>
            <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">{perf.conversionRate}%</p>
          </div>
        </div>
      )}

      {/* Assigned Properties */}
      <ChartCard
        title="Assigned Properties"
        subtitle={`${agent.assignedProperties?.length ?? 0} properties`}
        action={
          <div className="rounded-lg bg-indigo-50 p-2 dark:bg-indigo-900/30">
            <Building2 size={16} className="text-indigo-600 dark:text-indigo-400" />
          </div>
        }
      >
        {agent.assignedProperties?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-xs font-medium uppercase text-gray-500 dark:border-gray-700 dark:text-gray-400">
                  <th className="pb-3 pr-4">Title</th>
                  <th className="pb-3 pr-4">Type</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3 text-right">Price</th>
                </tr>
              </thead>
              <tbody>
                {agent.assignedProperties.map((prop) => (
                  <tr
                    key={prop.id}
                    className="border-b border-gray-100 last:border-0 dark:border-gray-700/50"
                  >
                    <td className="py-2.5 pr-4">
                      <Link
                        to={`/properties/${prop.id}`}
                        className="font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                      >
                        {prop.title}
                      </Link>
                    </td>
                    <td className="py-2.5 pr-4 text-gray-600 dark:text-gray-400">{prop.type}</td>
                    <td className="py-2.5 pr-4">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          prop.status === 'AVAILABLE'
                            ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : prop.status === 'SOLD'
                              ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
                              : 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                        }`}
                      >
                        {prop.status}
                      </span>
                    </td>
                    <td className="py-2.5 text-right font-medium text-gray-800 dark:text-gray-200">
                      {formatCurrency(prop.price)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-gray-400">No assigned properties</p>
        )}
      </ChartCard>

      {/* Assigned Clients */}
      <ChartCard
        title="Assigned Clients"
        subtitle={`${agent.assignedClients?.length ?? 0} clients`}
        action={
          <div className="rounded-lg bg-green-50 p-2 dark:bg-green-900/30">
            <Users size={16} className="text-green-600 dark:text-green-400" />
          </div>
        }
      >
        {agent.assignedClients?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-xs font-medium uppercase text-gray-500 dark:border-gray-700 dark:text-gray-400">
                  <th className="pb-3 pr-4">Name</th>
                  <th className="pb-3 pr-4">Email</th>
                  <th className="pb-3">Phone</th>
                </tr>
              </thead>
              <tbody>
                {agent.assignedClients.map((client) => (
                  <tr
                    key={client.id}
                    className="border-b border-gray-100 last:border-0 dark:border-gray-700/50"
                  >
                    <td className="py-2.5 pr-4">
                      <Link
                        to={`/clients/${client.id}`}
                        className="font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                      >
                        {client.firstName} {client.lastName}
                      </Link>
                    </td>
                    <td className="py-2.5 pr-4 text-gray-600 dark:text-gray-400">{client.email}</td>
                    <td className="py-2.5 text-gray-600 dark:text-gray-400">{client.phone ?? '--'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-gray-400">No assigned clients</p>
        )}
      </ChartCard>

      {/* Assigned Leads */}
      <ChartCard
        title="Assigned Leads"
        subtitle={`${agent.assignedLeads?.length ?? 0} leads`}
        action={
          <div className="rounded-lg bg-amber-50 p-2 dark:bg-amber-900/30">
            <FileText size={16} className="text-amber-600 dark:text-amber-400" />
          </div>
        }
      >
        {agent.assignedLeads?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-xs font-medium uppercase text-gray-500 dark:border-gray-700 dark:text-gray-400">
                  <th className="pb-3 pr-4">Title</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3 pr-4">Priority</th>
                  <th className="pb-3 pr-4">Source</th>
                  <th className="pb-3">Created</th>
                </tr>
              </thead>
              <tbody>
                {agent.assignedLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="border-b border-gray-100 last:border-0 dark:border-gray-700/50"
                  >
                    <td className="py-2.5 pr-4">
                      <Link
                        to={`/leads/${lead.id}`}
                        className="font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                      >
                        {lead.title}
                      </Link>
                    </td>
                    <td className="py-2.5 pr-4">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          lead.status === 'WON'
                            ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : lead.status === 'LOST'
                              ? 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                              : 'bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400'
                        }`}
                      >
                        {lead.status}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          lead.priority === 'HIGH'
                            ? 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            : lead.priority === 'MEDIUM'
                              ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                              : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {lead.priority}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 text-gray-600 dark:text-gray-400">
                      {lead.source ?? '--'}
                    </td>
                    <td className="py-2.5 text-gray-600 dark:text-gray-400">
                      {new Date(lead.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-gray-400">No assigned leads</p>
        )}
      </ChartCard>
    </div>
  )
}
