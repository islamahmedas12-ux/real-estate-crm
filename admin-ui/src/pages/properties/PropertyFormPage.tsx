import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { ArrowLeft, Save, Plus, X } from 'lucide-react'
import { propertiesApi } from '../../api/properties'
import { Button, Input, Select, Textarea, LoadingSpinner } from '../../components/ui'
import { PROPERTY_TYPES } from '../../types/property'
import type { CreatePropertyPayload } from '../../types/property'

const EMPTY_FORM: CreatePropertyPayload = {
  title: '',
  description: '',
  type: 'APARTMENT',
  price: '',
  area: '',
  bedrooms: undefined,
  bathrooms: undefined,
  floor: undefined,
  address: '',
  city: '',
  region: '',
  latitude: '',
  longitude: '',
  features: [],
}

export default function PropertyFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [form, setForm] = useState<CreatePropertyPayload>(EMPTY_FORM)
  const [featureInput, setFeatureInput] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Load existing property for edit
  const { data: existing, isLoading: loadingExisting } = useQuery({
    queryKey: ['property', id],
    queryFn: () => propertiesApi.get(id!),
    enabled: isEdit,
  })

  useEffect(() => {
    if (existing) {
      setForm({
        title: existing.title,
        description: existing.description ?? '',
        type: existing.type,
        price: existing.price,
        area: existing.area,
        bedrooms: existing.bedrooms ?? undefined,
        bathrooms: existing.bathrooms ?? undefined,
        floor: existing.floor ?? undefined,
        address: existing.address,
        city: existing.city,
        region: existing.region,
        latitude: existing.latitude ?? '',
        longitude: existing.longitude ?? '',
        features: existing.features ?? [],
      })
    }
  }, [existing])

  const createMutation = useMutation({
    mutationFn: (data: CreatePropertyPayload) => propertiesApi.create(data),
    onSuccess: (created) => {
      toast.success('Property created successfully')
      queryClient.invalidateQueries({ queryKey: ['properties'] })
      navigate(`/properties/${created.id}`)
    },
    onError: () => toast.error('Failed to create property'),
  })

  const updateMutation = useMutation({
    mutationFn: (data: CreatePropertyPayload) => propertiesApi.update(id!, data),
    onSuccess: () => {
      toast.success('Property updated successfully')
      queryClient.invalidateQueries({ queryKey: ['properties'] })
      queryClient.invalidateQueries({ queryKey: ['property', id] })
      navigate(`/properties/${id}`)
    },
    onError: () => toast.error('Failed to update property'),
  })

  const saving = createMutation.isPending || updateMutation.isPending

  function validate(): boolean {
    const errs: Record<string, string> = {}
    if (!form.title.trim()) errs.title = 'Title is required'
    if (!form.price) errs.price = 'Price is required'
    if (!form.area) errs.area = 'Area is required'
    if (!form.address.trim()) errs.address = 'Address is required'
    if (!form.city.trim()) errs.city = 'City is required'
    if (!form.region.trim()) errs.region = 'Region is required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    // Clean optional fields
    const payload: CreatePropertyPayload = {
      ...form,
      price: form.price,
      area: form.area,
      bedrooms: form.bedrooms || undefined,
      bathrooms: form.bathrooms || undefined,
      floor: form.floor || undefined,
      latitude: form.latitude || undefined,
      longitude: form.longitude || undefined,
      features: form.features?.length ? form.features : undefined,
      description: form.description?.trim() || undefined,
    }

    if (isEdit) {
      updateMutation.mutate(payload)
    } else {
      createMutation.mutate(payload)
    }
  }

  function updateField<K extends keyof CreatePropertyPayload>(key: K, value: CreatePropertyPayload[K]) {
    setForm((f) => ({ ...f, [key]: value }))
    if (errors[key]) setErrors((e) => ({ ...e, [key]: '' }))
  }

  function addFeature() {
    const trimmed = featureInput.trim()
    if (trimmed && !form.features?.includes(trimmed)) {
      updateField('features', [...(form.features ?? []), trimmed])
      setFeatureInput('')
    }
  }

  function removeFeature(feature: string) {
    updateField('features', (form.features ?? []).filter((f) => f !== feature))
  }

  if (isEdit && loadingExisting) return <LoadingSpinner message="Loading property..." />

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(isEdit ? `/properties/${id}` : '/properties')}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors"
        >
          <ArrowLeft size={16} /> Back
        </button>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
        {isEdit ? 'Edit Property' : 'New Property'}
      </h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Basic Info */}
        <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
            Basic Information
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Input
                label="Title"
                required
                value={form.title}
                onChange={(e) => updateField('title', e.target.value)}
                error={errors.title}
                placeholder="e.g. Luxury 3BR Apartment in Zamalek"
              />
            </div>

            <Select
              label="Property Type"
              required
              value={form.type}
              onChange={(e) => updateField('type', e.target.value as CreatePropertyPayload['type'])}
              options={PROPERTY_TYPES}
            />

            <Input
              label="Price (EGP)"
              required
              type="number"
              min={0}
              step="0.01"
              value={form.price}
              onChange={(e) => updateField('price', e.target.value)}
              error={errors.price}
              placeholder="2500000"
            />

            <Input
              label="Area (m²)"
              required
              type="number"
              min={0}
              step="0.01"
              value={form.area}
              onChange={(e) => updateField('area', e.target.value)}
              error={errors.area}
              placeholder="180"
            />

            <Input
              label="Bedrooms"
              type="number"
              min={0}
              value={form.bedrooms ?? ''}
              onChange={(e) => updateField('bedrooms', e.target.value ? Number(e.target.value) : undefined)}
              placeholder="3"
            />

            <Input
              label="Bathrooms"
              type="number"
              min={0}
              value={form.bathrooms ?? ''}
              onChange={(e) => updateField('bathrooms', e.target.value ? Number(e.target.value) : undefined)}
              placeholder="2"
            />

            <Input
              label="Floor"
              type="number"
              value={form.floor ?? ''}
              onChange={(e) => updateField('floor', e.target.value ? Number(e.target.value) : undefined)}
              placeholder="5"
            />

            <div className="sm:col-span-2">
              <Textarea
                label="Description"
                value={form.description ?? ''}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="Detailed description of the property..."
              />
            </div>
          </div>
        </section>

        {/* Location */}
        <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
            Location
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Input
                label="Address"
                required
                value={form.address}
                onChange={(e) => updateField('address', e.target.value)}
                error={errors.address}
                placeholder="15 Abu El Feda St"
              />
            </div>
            <Input
              label="City"
              required
              value={form.city}
              onChange={(e) => updateField('city', e.target.value)}
              error={errors.city}
              placeholder="Cairo"
            />
            <Input
              label="Region / District"
              required
              value={form.region}
              onChange={(e) => updateField('region', e.target.value)}
              error={errors.region}
              placeholder="Zamalek"
            />
            <Input
              label="Latitude"
              type="number"
              step="0.0000001"
              value={form.latitude ?? ''}
              onChange={(e) => updateField('latitude', e.target.value)}
              placeholder="30.0561000"
            />
            <Input
              label="Longitude"
              type="number"
              step="0.0000001"
              value={form.longitude ?? ''}
              onChange={(e) => updateField('longitude', e.target.value)}
              placeholder="31.2243000"
            />
          </div>
        </section>

        {/* Features */}
        <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
            Features
          </h2>
          <div className="flex gap-2">
            <Input
              value={featureInput}
              onChange={(e) => setFeatureInput(e.target.value)}
              placeholder="e.g. pool, gym, parking"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addFeature()
                }
              }}
            />
            <Button type="button" variant="secondary" onClick={addFeature} leftIcon={<Plus size={14} />}>
              Add
            </Button>
          </div>
          {form.features && form.features.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {form.features.map((f) => (
                <span
                  key={f}
                  className="inline-flex items-center gap-1 rounded-full bg-indigo-50 pl-3 pr-1.5 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
                >
                  {f}
                  <button
                    type="button"
                    onClick={() => removeFeature(f)}
                    className="rounded-full p-0.5 hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </section>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate(isEdit ? `/properties/${id}` : '/properties')}
          >
            Cancel
          </Button>
          <Button type="submit" loading={saving} leftIcon={<Save size={16} />}>
            {isEdit ? 'Save Changes' : 'Create Property'}
          </Button>
        </div>
      </form>
    </div>
  )
}
