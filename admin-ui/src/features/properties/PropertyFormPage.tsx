/**
 * PropertyFormPage — Create / Edit property with image upload.
 *
 * Dependencies to install (not yet in package.json):
 *   npm i react-hook-form zod @hookform/resolvers
 *
 * Until those are installed the app will fail to compile.
 * To use with the existing stack, swap validation to manual (see pages/properties/PropertyFormPage.tsx).
 *
 * API endpoints:
 *   POST   /api/properties               → create
 *   PUT    /api/properties/:id            → update
 *   POST   /api/properties/:id/images     → upload images (multipart/form-data)
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import {
  ArrowLeft,
  Save,
  Plus,
  X,
  Upload,
  ImageIcon,
  GripVertical,
  Trash2,
} from 'lucide-react'
import { propertiesApi } from '../../api/properties'
import apiClient from '../../api/client'
import { Button, Input, Select, Textarea, LoadingSpinner } from '../../components/ui'
import { PROPERTY_TYPES } from '../../types/property'
import type { CreatePropertyPayload, PropertyImage } from '../../types/property'

/* ------------------------------------------------------------------ */
/*  Zod schema                                                         */
/* ------------------------------------------------------------------ */
const propertySchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().max(5000).optional().or(z.literal('')),
  type: z.enum([
    'APARTMENT',
    'VILLA',
    'OFFICE',
    'SHOP',
    'LAND',
    'BUILDING',
    'CHALET',
    'STUDIO',
    'DUPLEX',
    'PENTHOUSE',
  ]),
  price: z
    .string()
    .min(1, 'Price is required')
    .refine((v) => !isNaN(Number(v)) && Number(v) > 0, 'Enter a valid price'),
  area: z
    .string()
    .min(1, 'Area is required')
    .refine((v) => !isNaN(Number(v)) && Number(v) > 0, 'Enter a valid area'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  region: z.string().min(1, 'Region is required'),
  bedrooms: z.coerce.number().int().min(0).optional().or(z.literal(undefined as unknown as number)),
  bathrooms: z.coerce.number().int().min(0).optional().or(z.literal(undefined as unknown as number)),
  floor: z.coerce.number().int().optional().or(z.literal(undefined as unknown as number)),
  latitude: z.string().optional().or(z.literal('')),
  longitude: z.string().optional().or(z.literal('')),
  features: z.array(z.string()).optional(),
})

type PropertyFormValues = z.infer<typeof propertySchema>

/* ------------------------------------------------------------------ */
/*  Image preview type                                                 */
/* ------------------------------------------------------------------ */
interface ImagePreview {
  id: string
  file?: File
  url: string
  isExisting: boolean
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function PropertyFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  /* --- react-hook-form --- */
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PropertyFormValues>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      title: '',
      description: '',
      type: 'APARTMENT',
      price: '',
      area: '',
      address: '',
      city: '',
      region: '',
      bedrooms: undefined,
      bathrooms: undefined,
      floor: undefined,
      latitude: '',
      longitude: '',
      features: [],
    },
  })

  /* --- features (tag-style input) --- */
  const [featureInput, setFeatureInput] = useState('')
  const [features, setFeatures] = useState<string[]>([])

  /* --- image upload state --- */
  const [images, setImages] = useState<ImagePreview[]>([])
  const [uploadingImages, setUploadingImages] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  /* --- load existing property for edit --- */
  const { data: existing, isLoading: loadingExisting } = useQuery({
    queryKey: ['property', id],
    queryFn: () => propertiesApi.get(id!),
    enabled: isEdit,
  })

  useEffect(() => {
    if (existing) {
      reset({
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
      setFeatures(existing.features ?? [])
      setImages(
        (existing.images ?? []).map((img: PropertyImage) => ({
          id: img.id,
          url: img.url,
          isExisting: true,
        })),
      )
    }
  }, [existing, reset])

  /* ---------------------------------------------------------------- */
  /*  Image handling                                                    */
  /* ---------------------------------------------------------------- */
  const addFiles = useCallback((files: FileList | File[]) => {
    const newPreviews: ImagePreview[] = Array.from(files)
      .filter((f) => f.type.startsWith('image/'))
      .map((f) => ({
        id: crypto.randomUUID(),
        file: f,
        url: URL.createObjectURL(f),
        isExisting: false,
      }))
    setImages((prev) => [...prev, ...newPreviews])
  }, [])

  const removeImage = useCallback((imgId: string) => {
    setImages((prev) => {
      const removed = prev.find((i) => i.id === imgId)
      if (removed && !removed.isExisting) URL.revokeObjectURL(removed.url)
      return prev.filter((i) => i.id !== imgId)
    })
  }, [])

  /* drag-drop handlers */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
      if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files)
    },
    [addFiles],
  )

  /* upload images to API after property is created/updated */
  async function uploadImages(propertyId: string) {
    const newImages = images.filter((i) => !i.isExisting && i.file)
    if (newImages.length === 0) return

    setUploadingImages(true)
    try {
      for (const img of newImages) {
        const formData = new FormData()
        formData.append('image', img.file!)
        await apiClient.post(`/api/properties/${propertyId}/images`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      }
      toast.success(`${newImages.length} image(s) uploaded`)
    } catch {
      toast.error('Some images failed to upload')
    } finally {
      setUploadingImages(false)
    }
  }

  /* ---------------------------------------------------------------- */
  /*  Mutations                                                        */
  /* ---------------------------------------------------------------- */
  const createMutation = useMutation({
    mutationFn: (data: CreatePropertyPayload) => propertiesApi.create(data),
    onSuccess: async (created) => {
      await uploadImages(created.id)
      toast.success('Property created successfully')
      queryClient.invalidateQueries({ queryKey: ['properties'] })
      navigate(`/properties/${created.id}`)
    },
    onError: () => toast.error('Failed to create property'),
  })

  const updateMutation = useMutation({
    mutationFn: (data: CreatePropertyPayload) => propertiesApi.update(id!, data),
    onSuccess: async () => {
      await uploadImages(id!)
      toast.success('Property updated successfully')
      queryClient.invalidateQueries({ queryKey: ['properties'] })
      queryClient.invalidateQueries({ queryKey: ['property', id] })
      navigate(`/properties/${id}`)
    },
    onError: () => toast.error('Failed to update property'),
  })

  const saving = createMutation.isPending || updateMutation.isPending || uploadingImages

  /* ---------------------------------------------------------------- */
  /*  Submit                                                           */
  /* ---------------------------------------------------------------- */
  function onSubmit(values: PropertyFormValues) {
    const payload: CreatePropertyPayload = {
      ...values,
      description: values.description?.trim() || undefined,
      bedrooms: values.bedrooms || undefined,
      bathrooms: values.bathrooms || undefined,
      floor: values.floor || undefined,
      latitude: values.latitude || undefined,
      longitude: values.longitude || undefined,
      features: features.length ? features : undefined,
    }

    if (isEdit) {
      updateMutation.mutate(payload)
    } else {
      createMutation.mutate(payload)
    }
  }

  /* ---------------------------------------------------------------- */
  /*  Feature tags                                                     */
  /* ---------------------------------------------------------------- */
  function addFeature() {
    const trimmed = featureInput.trim()
    if (trimmed && !features.includes(trimmed)) {
      setFeatures((prev) => [...prev, trimmed])
      setFeatureInput('')
    }
  }

  function removeFeature(feat: string) {
    setFeatures((prev) => prev.filter((f) => f !== feat))
  }

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */
  if (isEdit && loadingExisting) return <LoadingSpinner message="Loading property..." />

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      {/* Back link */}
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
        {/* ── Basic Information ── */}
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

            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <Select
                  label="Property Type"
                  required
                  value={field.value}
                  onChange={field.onChange}
                  options={PROPERTY_TYPES}
                />
              )}
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
              {...register('bedrooms', { setValueAs: (v: string) => (v === '' ? undefined : Number(v)) })}
              placeholder="3"
            />

            <Input
              label="Bathrooms"
              type="number"
              min={0}
              {...register('bathrooms', { setValueAs: (v: string) => (v === '' ? undefined : Number(v)) })}
              placeholder="2"
            />

            <Input
              label="Floor"
              type="number"
              {...register('floor', { setValueAs: (v: string) => (v === '' ? undefined : Number(v)) })}
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

        {/* ── Location ── */}
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

        {/* ── Image Upload ── */}
        <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
            Images
          </h2>

          {/* Drop zone */}
          <div
            ref={dropZoneRef}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`
              flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed
              px-6 py-10 cursor-pointer transition-colors
              ${
                isDragOver
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                  : 'border-gray-300 bg-gray-50 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800/50 dark:hover:bg-gray-700/50'
              }
            `}
          >
            <Upload size={32} className="text-gray-400" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                Click to upload
              </span>{' '}
              or drag and drop
            </p>
            <p className="text-xs text-gray-400">PNG, JPG, WEBP up to 10 MB each</p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.length) addFiles(e.target.files)
                e.target.value = '' // allow re-selecting same file
              }}
            />
          </div>

          {/* Preview thumbnails */}
          {images.length > 0 && (
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {images.map((img) => (
                <div
                  key={img.id}
                  className="group relative aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700"
                >
                  <img
                    src={img.url}
                    alt="Property"
                    className="h-full w-full object-cover"
                  />
                  {/* overlay on hover */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => removeImage(img.id)}
                      className="rounded-full bg-red-600 p-2 text-white hover:bg-red-700 transition-colors"
                      title="Remove image"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  {/* badge for new uploads */}
                  {!img.isExisting && (
                    <span className="absolute top-1 left-1 rounded bg-indigo-600 px-1.5 py-0.5 text-[10px] font-medium text-white">
                      New
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Features ── */}
        <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
            Features
          </h2>
          <div className="flex gap-2">
            <Input
              value={featureInput}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFeatureInput(e.target.value)}
              placeholder="e.g. pool, gym, parking"
              onKeyDown={(e: React.KeyboardEvent) => {
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

        {/* ── Actions ── */}
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
