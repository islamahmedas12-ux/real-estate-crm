import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  ArrowLeft,
  Edit,
  Trash2,
  MapPin,
  BedDouble,
  Bath,
  Layers,
  Maximize2,
  User,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { propertiesApi } from '../../api/properties'
import { Button, LoadingSpinner, Select, ConfirmDialog } from '../../components/ui'
import { PROPERTY_STATUSES } from '../../types/property'
import { formatCurrency, cn } from '../../utils'
import type { PropertyStatus } from '../../types/property'

export default function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showDelete, setShowDelete] = useState(false)
  const [activeImage, setActiveImage] = useState(0)

  const { data: property, isLoading, error } = useQuery({
    queryKey: ['property', id],
    queryFn: () => propertiesApi.get(id!),
    enabled: !!id,
  })

  const deleteMutation = useMutation({
    mutationFn: () => propertiesApi.delete(id!),
    onSuccess: () => {
      toast.success('Property deleted')
      queryClient.invalidateQueries({ queryKey: ['properties'] })
      navigate('/properties')
    },
    onError: () => toast.error('Failed to delete property'),
  })

  const statusMutation = useMutation({
    mutationFn: (status: PropertyStatus) => propertiesApi.changeStatus(id!, status),
    onSuccess: () => {
      toast.success('Status updated')
      queryClient.invalidateQueries({ queryKey: ['property', id] })
      queryClient.invalidateQueries({ queryKey: ['properties'] })
    },
    onError: () => toast.error('Failed to update status'),
  })

  if (isLoading) return <LoadingSpinner message="Loading property..." />
  if (error || !property) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-gray-500 dark:text-gray-400">
        <p>Property not found.</p>
        <Button variant="secondary" onClick={() => navigate('/properties')}>
          Back to Properties
        </Button>
      </div>
    )
  }

  const statusMeta = PROPERTY_STATUSES.find((s) => s.value === property.status)
  const images = property.images?.sort((a, b) => a.order - b.order) ?? []

  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumb + actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={() => navigate('/properties')}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors"
        >
          <ArrowLeft size={16} /> Back to Properties
        </button>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Edit size={14} />}
            onClick={() => navigate(`/properties/${id}/edit`)}
          >
            Edit
          </Button>
          <Button
            variant="danger"
            size="sm"
            leftIcon={<Trash2 size={14} />}
            onClick={() => setShowDelete(true)}
          >
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Image gallery */}
          {images.length > 0 && (
            <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
              <div className="relative h-80">
                <img
                  src={images[activeImage]?.url}
                  alt={images[activeImage]?.caption ?? property.title}
                  className="h-full w-full object-cover"
                />
                {images.length > 1 && (
                  <>
                    <button
                      onClick={() => setActiveImage((i) => (i === 0 ? images.length - 1 : i - 1))}
                      className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-1.5 text-white hover:bg-black/60 transition-colors"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      onClick={() => setActiveImage((i) => (i === images.length - 1 ? 0 : i + 1))}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-1.5 text-white hover:bg-black/60 transition-colors"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </>
                )}
                <span className="absolute bottom-2 right-2 rounded-full bg-black/50 px-2.5 py-0.5 text-xs text-white">
                  {activeImage + 1} / {images.length}
                </span>
              </div>
              {images.length > 1 && (
                <div className="flex gap-1 overflow-x-auto p-2">
                  {images.map((img, idx) => (
                    <button
                      key={img.id}
                      onClick={() => setActiveImage(idx)}
                      className={cn(
                        'h-16 w-20 flex-shrink-0 overflow-hidden rounded-md border-2 transition-all',
                        idx === activeImage
                          ? 'border-indigo-500 opacity-100'
                          : 'border-transparent opacity-60 hover:opacity-100',
                      )}
                    >
                      <img src={img.url} alt={img.caption ?? ''} className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Title + details */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{property.title}</h1>
                <div className="mt-1 flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                  <MapPin size={14} />
                  {property.address}, {property.region}, {property.city}
                </div>
              </div>
              <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                {formatCurrency(Number(property.price))}
              </p>
            </div>

            {/* Quick stats */}
            <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <InfoItem icon={<Maximize2 size={16} />} label="Area" value={`${Number(property.area).toLocaleString()} m²`} />
              {property.bedrooms != null && (
                <InfoItem icon={<BedDouble size={16} />} label="Bedrooms" value={String(property.bedrooms)} />
              )}
              {property.bathrooms != null && (
                <InfoItem icon={<Bath size={16} />} label="Bathrooms" value={String(property.bathrooms)} />
              )}
              {property.floor != null && (
                <InfoItem icon={<Layers size={16} />} label="Floor" value={String(property.floor)} />
              )}
            </div>

            {property.description && (
              <div className="mt-5 border-t border-gray-100 pt-5 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Description</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                  {property.description}
                </p>
              </div>
            )}

            {property.features && property.features.length > 0 && (
              <div className="mt-5 border-t border-gray-100 pt-5 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Features</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {property.features.map((f) => (
                    <span
                      key={f}
                      className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Related leads */}
          {property.leads && property.leads.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Related Leads</h3>
              <div className="mt-3 divide-y divide-gray-100 dark:divide-gray-700">
                {property.leads.map((lead) => (
                  <div key={lead.id} className="flex items-center justify-between py-2.5 text-sm">
                    <span className="text-gray-800 dark:text-gray-200">{lead.title}</span>
                    <div className="flex items-center gap-3">
                      <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                        {lead.status}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(lead.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Related contracts */}
          {property.contracts && property.contracts.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Contracts</h3>
              <div className="mt-3 divide-y divide-gray-100 dark:divide-gray-700">
                {property.contracts.map((contract) => (
                  <div key={contract.id} className="flex items-center justify-between py-2.5 text-sm">
                    <div>
                      <span className="text-gray-800 dark:text-gray-200">{contract.type}</span>
                      <span className="ml-2 text-xs text-gray-400">{contract.status}</span>
                    </div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {formatCurrency(Number(contract.totalAmount))}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-4">
          {/* Status card */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Status</h3>
            <span className={cn('inline-block rounded-full px-3 py-1 text-xs font-semibold', statusMeta?.color)}>
              {statusMeta?.label ?? property.status}
            </span>
            <div className="mt-4">
              <Select
                label="Change Status"
                value={property.status}
                onChange={(e) => statusMutation.mutate(e.target.value as PropertyStatus)}
                options={PROPERTY_STATUSES.map((s) => ({ value: s.value, label: s.label }))}
              />
            </div>
          </div>

          {/* Type */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Type</h3>
            <p className="text-sm text-gray-800 dark:text-gray-200">{property.type.replace('_', ' ')}</p>
          </div>

          {/* Agent */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Assigned Agent</h3>
            {property.assignedAgent ? (
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/30">
                  <User size={16} className="text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    {property.assignedAgent.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{property.assignedAgent.email}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400">No agent assigned</p>
            )}
          </div>

          {/* Metadata */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Details</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500 dark:text-gray-400">ID</dt>
                <dd className="font-mono text-xs text-gray-700 dark:text-gray-300 truncate max-w-[180px]">
                  {property.id}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500 dark:text-gray-400">Created</dt>
                <dd className="text-gray-700 dark:text-gray-300">
                  {new Date(property.createdAt).toLocaleDateString()}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500 dark:text-gray-400">Updated</dt>
                <dd className="text-gray-700 dark:text-gray-300">
                  {new Date(property.updatedAt).toLocaleDateString()}
                </dd>
              </div>
              {property.latitude && property.longitude && (
                <div className="flex justify-between">
                  <dt className="text-gray-500 dark:text-gray-400">Coordinates</dt>
                  <dd className="text-gray-700 dark:text-gray-300 text-xs">
                    {property.latitude}, {property.longitude}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDelete}
        title="Delete Property"
        message={`Are you sure you want to delete "${property.title}"? This will set the property to OFF_MARKET status.`}
        confirmLabel="Delete"
        onConfirm={() => deleteMutation.mutate()}
        onCancel={() => setShowDelete(false)}
        loading={deleteMutation.isPending}
      />
    </div>
  )
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2.5 dark:bg-gray-700/40">
      <span className="text-indigo-500 dark:text-indigo-400">{icon}</span>
      <div>
        <p className="text-[11px] text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{value}</p>
      </div>
    </div>
  )
}
