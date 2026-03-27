import { useState, useEffect } from 'react'
import { X, Mail, Phone, User, Tag, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import { cn, formatDate } from '../../utils'
import { Badge, LoadingSpinner } from '../ui'
import { LeadStatusBadge } from '../leads/LeadStatusBadge'
import { clientsApi } from '../../api/clients'
import type { Client } from '../../types'

interface ClientDetailPanelProps {
  clientId: string
  onClose: () => void
}

export function ClientDetailPanel({ clientId, onClose }: ClientDetailPanelProps) {
  const [client, setClient] = useState<Client | null>(null)
  const [history, setHistory] = useState<unknown[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      try {
        const [clientData, histData] = await Promise.all([
          clientsApi.get(clientId),
          clientsApi.history(clientId),
        ])
        setClient(clientData)
        setHistory(histData)
      } catch {
        toast.error('Failed to load client details')
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [clientId])

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div
        className={cn(
          'relative w-full max-w-md bg-white dark:bg-gray-800 shadow-xl',
          'border-l border-gray-200 dark:border-gray-700',
          'overflow-y-auto p-6',
        )}
      >
        {loading ? (
          <LoadingSpinner />
        ) : client ? (
          <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {client.firstName} {client.lastName}
                </h2>
                <Badge
                  variant={
                    client.type === 'BUYER' ? 'blue' :
                    client.type === 'SELLER' ? 'green' :
                    client.type === 'INVESTOR' ? 'indigo' :
                    'purple'
                  }
                >
                  {client.type}
                </Badge>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Contact Info */}
            <div className="flex flex-col gap-2">
              {client.email && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Mail size={14} />
                  <span>{client.email}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Phone size={14} />
                <span>{client.phone}</span>
              </div>
              {client.nationalId && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <User size={14} />
                  <span>ID: {client.nationalId}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Tag size={14} />
                <span>Source: {client.source.replace(/_/g, ' ')}</span>
              </div>
            </div>

            {client.notes && (
              <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                {client.notes}
              </div>
            )}

            {/* Leads */}
            {client.leads && client.leads.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Leads ({client.leads.length})
                </h3>
                <div className="flex flex-col gap-2">
                  {client.leads.map((lead) => (
                    <div
                      key={lead.id}
                      className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 text-sm"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-gray-900 dark:text-gray-100">
                          {lead.property?.title ?? 'No property'}
                        </span>
                        <LeadStatusBadge status={lead.status} />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Created {formatDate(lead.createdAt)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Interaction History */}
            {history.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Recent History
                </h3>
                <div className="flex flex-col gap-2">
                  {history.slice(0, 10).map((item, idx) => {
                    const entry = item as Record<string, unknown>
                    return (
                      <div key={idx} className="flex gap-2 text-sm">
                        <Clock size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">
                            {String(entry.description ?? entry.type ?? 'Activity')}
                          </p>
                          {entry.createdAt != null && (
                            <p className="text-xs text-gray-400">{formatDate(String(entry.createdAt))}</p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <p className="text-xs text-gray-400">Created {formatDate(client.createdAt)}</p>
          </div>
        ) : null}
      </div>
    </div>
  )
}
