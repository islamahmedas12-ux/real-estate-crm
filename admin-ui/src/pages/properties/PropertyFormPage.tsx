import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import { ArrowLeft, Save, Plus, X } from 'lucide-react'
import { propertiesApi } from '../../api/properties'
import { Button, Input, Select, Textarea, LoadingSpinner } from '../../components/ui'
import { PROPERTY_TYPES } from '../../types/property'
import type { CreatePropertyPayload } from '../../types/property'
import { propertySchema, type PropertyFormData } from '../../schemas'

export default function PropertyFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PropertyFormData>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
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
    },
  })

  const [featureInput, setFeatureInput] = useState('')
  const features = watch('features') ?? []

  const { data: existing, isLoading: loadingExisting } = useQuery({
    queryKey: ['property', id],
    queryFn: () => propertiesApi.get(id!),
    enabled: isEdit,
  })

  useEffect(() => {
    if (existing) {
      setValue('title', existing.title)
      setValue('description', existing.description ?? '')
      setValue('type', existing.type as PropertyFormData['type'])
      setValue('price', existing.price)
      setValue('area', existing.area)
      setValue('bedrooms', existing.bedrooms ?? undefined)
      setValue('bathrooms', existing.bathrooms ?? undefined)
      setValue('floor', existing.floor ?? undefined)
      setValue('address', existing.address)
      setValue('city', existing.city)
      setValue('region', existing.region)
      setValue('latitude', existing.latitude ?? '')
      setValue('longitude', existing.longitude ?? '')
      setValue('features', existing.features ?? [])
    }
  }, [existing, setValue])

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

  function onSubmit(data: PropertyFormData) {
    const payload = {
      ...data,
      bedrooms: data.bedrooms || undefined,
      bathrooms: data.bathrooms || undefined,
      floor: data.floor || undefined,
      latitude: data.latitude || undefined,
      longitude: data.longitude || undefined,
      features: data.features?.length ? data.features : undefined,
      description: data.description?.trim() || undefined,
    } as CreatePropertyPayload
    if (isEdit) {
      updateMutation.mutate(payload)
    } else {
      createMutation.mutate(payload)
    }
  }

  function addFeature() {
    const trimmed = featureInput.trim()
    if (trimmed && !features.includes(trimmed)) {
      setValue('features', [...features, trimmed])
      setFeatureInput('')
    }
  }

  function removeFeature(feature: string) {
    setValue('features', features.filter((f) => f !== feature))
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

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
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
                {...register('title')}
                error={errors.title?.message}
                placeholder="e.g. Luxury 3BR Apartment in Zamalek"
              />
            </div>

            <Select
              label="Property Type"
              required
              {...register('type')}
              options={PROPERTY_TYPES}
            />

            <Input
              label="Price (EGP)"
              required
              type="number"
              min={0}
              step="0.01"
              {...register('price')}
              error={errors.price?.message}
              placeholder="2500000"
            />

            <Input
              label="Area (m²)"
              required
              type="number"
              min={0}
              step="0.01"
              {...register('area')}
              error={errors.area?.message}
              placeholder="180"
            />

            <Input
              label="Bedrooms"
              type="number"
              min={0}
              {...register('bedrooms', { valueAsNumber: true })}
              placeholder="3"
            />

            <Input
              label="Bathrooms"
              type="number"
              min={0}
              {...register('bathrooms', { valueAsNumber: true })}
              placeholder="2"
            />

            <Input
              label="Floor"
              type="number"
              {...register('floor', { valueAsNumber: true })}
              placeholder="5"
            />

            <div className="sm:col-span-2">
              <Textarea
                label="Description"
                {...register('description')}
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
                {...register('address')}
                error={errors.address?.message}
                placeholder="15 Abu El Feda St"
              />
            </div>
            <Input
              label="City"
              required
              {...register('city')}
              error={errors.city?.message}
              placeholder="Cairo"
            />
            <Input
              label="Region / District"
              required
              {...register('region')}
              error={errors.region?.message}
              placeholder="Zamalek"
            />
            <Input
              label="Latitude"
              type="number"
              step="0.0000001"
              {...register('latitude')}
              placeholder="30.0561000"
            />
            <Input
              label="Longitude"
              type="number"
              step="0.0000001"
              {...register('longitude')}
              placeholder="31.2243000"
            />
          </div>
        </section>

        {/* Features */}
        <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
            Features
          </h2>
          <div className="mt-2 flex gap-2">
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
          {features.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {features.map((f) => (
                <span
                  key={f}
                  className="inline-flex items-center gap-1 rounded-full bg-indigo-50 ps-3 pe-1.5 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
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