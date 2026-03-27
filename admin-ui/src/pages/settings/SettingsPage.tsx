import { useState, useEffect, useCallback } from 'react'
import { Settings, Building, Tag, Radio, Plus, Trash2, Save } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Button, Input } from '../../components/ui'
import { settingsApi } from '../../api/settings'
import type { CompanySettings, ConfigItem } from '../../types/reports'

type Tab = 'company' | 'property-types' | 'lead-sources'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('company')

  const tabs: { key: Tab; label: string; icon: typeof Settings }[] = [
    { key: 'company', label: 'Company Info', icon: Building },
    { key: 'property-types', label: 'Property Types', icon: Tag },
    { key: 'lead-sources', label: 'Lead Sources', icon: Radio },
  ]

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Settings size={24} className="text-indigo-500" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            Manage company information and configuration
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border border-gray-200 bg-white p-1 dark:border-gray-700 dark:bg-gray-800 w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={
                activeTab === tab.key
                  ? 'flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm'
                  : 'flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
              }
            >
              <Icon size={16} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {activeTab === 'company' && <CompanyInfoSection />}
      {activeTab === 'property-types' && <ConfigListSection kind="property-types" title="Property Types" />}
      {activeTab === 'lead-sources' && <ConfigListSection kind="lead-sources" title="Lead Sources" />}
    </div>
  )
}

// ─── Company Info Section ─────────────────────────────────────────────────

function CompanyInfoSection() {
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['settings', 'company'],
    queryFn: () => settingsApi.getCompany(),
    staleTime: 300_000,
  })

  const [form, setForm] = useState<CompanySettings>({
    name: '',
    address: '',
    phone: '',
    email: '',
    website: '',
  })

  useEffect(() => {
    if (data) setForm(data)
  }, [data])

  const mutation = useMutation({
    mutationFn: (payload: CompanySettings) => settingsApi.updateCompany(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'company'] })
      toast.success('Company info updated')
    },
    onError: () => {
      toast.error('Failed to update company info')
    },
  })

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      mutation.mutate(form)
    },
    [form, mutation],
  )

  function updateField(field: keyof CompanySettings, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  if (isLoading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-700" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800"
    >
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Input
            label="Company Name"
            value={form.name}
            onChange={(e) => updateField('name', e.target.value)}
            placeholder="Your Company Name"
          />
        </div>
        <div className="sm:col-span-2">
          <Input
            label="Address"
            value={form.address}
            onChange={(e) => updateField('address', e.target.value)}
            placeholder="123 Main St, City, Country"
          />
        </div>
        <Input
          label="Phone"
          value={form.phone}
          onChange={(e) => updateField('phone', e.target.value)}
          placeholder="+1 (555) 123-4567"
        />
        <Input
          label="Email"
          type="email"
          value={form.email}
          onChange={(e) => updateField('email', e.target.value)}
          placeholder="info@company.com"
        />
        <div className="sm:col-span-2">
          <Input
            label="Website"
            value={form.website}
            onChange={(e) => updateField('website', e.target.value)}
            placeholder="https://www.company.com"
          />
        </div>
      </div>
      <div className="mt-6 flex justify-end">
        <Button type="submit" loading={mutation.isPending} leftIcon={<Save size={16} />}>
          Save Changes
        </Button>
      </div>
    </form>
  )
}

// ─── Config List Section (Property Types / Lead Sources) ──────────────────

function ConfigListSection({ kind, title }: { kind: 'property-types' | 'lead-sources'; title: string }) {
  const queryClient = useQueryClient()

  const fetchFn = kind === 'property-types' ? settingsApi.getPropertyTypes : settingsApi.getLeadSources
  const updateFn = kind === 'property-types' ? settingsApi.updatePropertyTypes : settingsApi.updateLeadSources

  const { data, isLoading } = useQuery({
    queryKey: ['settings', kind],
    queryFn: fetchFn,
    staleTime: 300_000,
  })

  const [items, setItems] = useState<ConfigItem[]>([])

  useEffect(() => {
    if (data) setItems(data)
  }, [data])

  const mutation = useMutation({
    mutationFn: (payload: ConfigItem[]) => updateFn(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', kind] })
      toast.success(`${title} updated`)
    },
    onError: () => {
      toast.error(`Failed to update ${title.toLowerCase()}`)
    },
  })

  function addItem() {
    setItems((prev) => [
      ...prev,
      {
        id: `new-${Date.now()}`,
        label: '',
        value: '',
        isActive: true,
      },
    ])
  }

  function updateItem(index: number, field: keyof ConfigItem, value: string | boolean) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    )
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  function handleSave() {
    const filtered = items.filter((item) => item.label.trim() || item.value.trim())
    mutation.mutate(filtered)
  }

  if (isLoading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-700" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold text-gray-800 dark:text-gray-200">{title}</h2>
        <Button variant="secondary" size="sm" leftIcon={<Plus size={14} />} onClick={addItem}>
          Add
        </Button>
      </div>

      {items.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-400">
          No {title.toLowerCase()} configured. Click "Add" to create one.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item, index) => (
            <div
              key={item.id}
              className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/50"
            >
              <input
                type="text"
                value={item.label}
                onChange={(e) => updateItem(index, 'label', e.target.value)}
                placeholder="Label"
                className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:placeholder-gray-500"
              />
              <input
                type="text"
                value={item.value}
                onChange={(e) => updateItem(index, 'value', e.target.value)}
                placeholder="Value"
                className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:placeholder-gray-500"
              />
              <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={item.isActive}
                  onChange={(e) => updateItem(index, 'isActive', e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                Active
              </label>
              <button
                onClick={() => removeItem(index)}
                className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-5 flex justify-end">
        <Button loading={mutation.isPending} leftIcon={<Save size={16} />} onClick={handleSave}>
          Save {title}
        </Button>
      </div>
    </div>
  )
}
