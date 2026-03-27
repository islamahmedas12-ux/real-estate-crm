import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Edit,
  User,
  Building2,
  Calendar,
  DollarSign,
  Clock,
  MessageSquare,
  Phone,
  Mail,
  Video,
  FileText,
  Eye,
  RefreshCw,
  GitBranch,
  Plus,
} from 'lucide-react'
import { Button, Select, Textarea, LoadingSpinner } from '../../components/ui'
import { useLeadDetail, useLeadActivities, useAddLeadActivity, useChangeLeadStatus } from '../../hooks/useLeads'
import { formatDate, formatCurrency } from '../../utils'
import toast from 'react-hot-toast'
import type { LeadStatus, LeadActivityType } from '../../types/lead'

const statusColor: Record<string, string> = {
  NEW: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  CONTACTED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  QUALIFIED: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  PROPOSAL: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  NEGOTIATION: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  WON: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  LOST: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

const activityIcon: Record<string, React.ReactNode> = {
  CALL: <Phone size={14} />,
  EMAIL: <Mail size={14} />,
  MEETING: <Video size={14} />,
  NOTE: <FileText size={14} />,
  VIEWING: <Eye size={14} />,
  FOLLOW_UP: <RefreshCw size={14} />,
  STATUS_CHANGE: <GitBranch size={14} />,
}

const ACTIVITY_TYPES: { value: LeadActivityType; label: string }[] = [
  { value: 'CALL', label: 'Call' },
  { value: 'EMAIL', label: 'Email' },
  { value: 'MEETING', label: 'Meeting' },
  { value: 'NOTE', label: 'Note' },
  { value: 'VIEWING', label: 'Viewing' },
  { value: 'FOLLOW_UP', label: 'Follow-up' },
]

const STATUS_OPTIONS: { value: LeadStatus; label: string }[] = [
  { value: 'NEW', label: 'New' },
  { value: 'CONTACTED', label: 'Contacted' },
  { value: 'QUALIFIED', label: 'Qualified' },
  { value: 'PROPOSAL', label: 'Proposal' },
  { value: 'NEGOTIATION', label: 'Negotiation' },
  { value: 'WON', label: 'Won' },
  { value: 'LOST', label: 'Lost' },
]

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: lead, isLoading, isError } = useLeadDetail(id!)
  const { data: activitiesData } = useLeadActivities(id!)
  const addActivity = useAddLeadActivity()
  const changeStatus = useChangeLeadStatus()

  const [showActivityForm, setShowActivityForm] = useState(false)
  const [activityType, setActivityType] = useState<LeadActivityType>('NOTE')
  const [activityDesc, setActivityDesc] = useState('')

  async function handleAddActivity() {
    if (!activityDesc.trim()) return
    try {
      await addActivity.mutateAsync({
        id: id!,
        data: { type: activityType, description: activityDesc.trim() },
      })
      toast.success('Activity added')
      setActivityDesc('')
      setShowActivityForm(false)
    } catch {
      toast.error('Failed to add activity')
    }
  }

  async function handleStatusChange(newStatus: LeadStatus) {
    if (!lead || lead.status === newStatus) return
    try {
      await changeStatus.mutateAsync({
        id: id!,
        data: { status: newStatus },
      })
      toast.success(`Status changed to ${newStatus}`)
    } catch {
      toast.error('Invalid status transition')
    }
  }

  if (isLoading) return <LoadingSpinner message="Loading lead..." />
  if (isError || !lead) {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <p className="text-gray-500">Lead not found.</p>
        <Button variant="secondary" onClick={() => navigate('/leads')}>
          Back to Leads
        </Button>
      </div>
    )
  }

  const activities = activitiesData?.data ?? lead.activities ?? []

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/leads')}
            className="rounded-lg p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Lead &mdash;{' '}
              {lead.client
                ? `${lead.client.firstName} ${lead.client.lastName}`
                : 'Unknown'}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor[lead.status]}`}>
                {lead.status}
              </span>
              <span className="text-xs text-gray-500">{lead.priority} priority</span>
            </div>
          </div>
        </div>
        <Button leftIcon={<Edit size={16} />} onClick={() => navigate(`/leads/${id}/edit`)}>
          Edit Lead
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Status changer */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Change Status</h3>
            <Select
              options={STATUS_OPTIONS}
              value={lead.status}
              onChange={(e) => handleStatusChange(e.target.value as LeadStatus)}
              className="w-full"
            />
          </div>

          {/* Client Info */}
          {lead.client && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <User size={16} className="text-indigo-500" /> Client
              </h3>
              <div className="space-y-2 text-sm">
                <Link
                  to={`/clients/${lead.client.id}`}
                  className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  {lead.client.firstName} {lead.client.lastName}
                </Link>
                <p className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Phone size={12} /> {lead.client.phone}
                </p>
                {lead.client.email && (
                  <p className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Mail size={12} /> {lead.client.email}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Property */}
          {lead.property && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <Building2 size={16} className="text-indigo-500" /> Property
              </h3>
              <Link
                to={`/properties/${lead.property.id}`}
                className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                {lead.property.title}
              </Link>
            </div>
          )}

          {/* Details */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Details</h3>
            <dl className="space-y-2.5 text-sm">
              {lead.budget != null && (
                <div className="flex items-center gap-2">
                  <DollarSign size={14} className="text-gray-400 shrink-0" />
                  <dd className="text-gray-700 dark:text-gray-300">Budget: {formatCurrency(lead.budget)}</dd>
                </div>
              )}
              {lead.source && (
                <div className="flex items-center gap-2">
                  <MessageSquare size={14} className="text-gray-400 shrink-0" />
                  <dd className="text-gray-700 dark:text-gray-300">Source: {lead.source}</dd>
                </div>
              )}
              {lead.nextFollowUp && (
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-gray-400 shrink-0" />
                  <dd className="text-gray-700 dark:text-gray-300">Follow-up: {formatDate(lead.nextFollowUp)}</dd>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-gray-400 shrink-0" />
                <dd className="text-gray-700 dark:text-gray-300">Created: {formatDate(lead.createdAt)}</dd>
              </div>
              {lead.assignedAgent && (
                <div className="flex items-center gap-2">
                  <User size={14} className="text-gray-400 shrink-0" />
                  <dd className="text-gray-700 dark:text-gray-300">Agent: {lead.assignedAgent.name}</dd>
                </div>
              )}
              {lead.notes && (
                <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                  <dt className="text-xs font-medium text-gray-500 mb-1">Notes</dt>
                  <dd className="text-gray-700 dark:text-gray-300 whitespace-pre-line">{lead.notes}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        {/* Right: Activities */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Clock size={18} className="text-indigo-500" /> Activities
              </h2>
              <Button
                size="sm"
                variant={showActivityForm ? 'secondary' : 'primary'}
                leftIcon={<Plus size={14} />}
                onClick={() => setShowActivityForm(!showActivityForm)}
              >
                {showActivityForm ? 'Cancel' : 'Add Activity'}
              </Button>
            </div>

            {/* Add Activity Form */}
            {showActivityForm && (
              <div className="mb-6 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-900/10 p-4 space-y-3">
                <Select
                  label="Type"
                  options={ACTIVITY_TYPES}
                  value={activityType}
                  onChange={(e) => setActivityType(e.target.value as LeadActivityType)}
                />
                <Textarea
                  label="Description"
                  value={activityDesc}
                  onChange={(e) => setActivityDesc(e.target.value)}
                  placeholder="What happened?"
                  required
                />
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    onClick={handleAddActivity}
                    loading={addActivity.isPending}
                    disabled={!activityDesc.trim()}
                  >
                    Save Activity
                  </Button>
                </div>
              </div>
            )}

            {/* Activity Timeline */}
            {activities.length > 0 ? (
              <div className="relative pl-8 border-l-2 border-gray-200 dark:border-gray-700 space-y-6">
                {activities.map((act) => (
                  <div key={act.id} className="relative">
                    <div className="absolute -left-[2.35rem] top-0.5 flex items-center justify-center w-7 h-7 rounded-full bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-500">
                      {activityIcon[act.type] ?? <FileText size={14} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                          {act.type.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {formatDate(act.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{act.description}</p>
                      {act.performedByUser && (
                        <p className="text-[10px] text-gray-400 mt-1">by {act.performedByUser.name}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-8">No activities recorded yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
