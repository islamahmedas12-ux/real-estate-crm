import { useState, useCallback } from 'react'
import {
  BarChart3,
  Download,
  DollarSign,
  Users,
  Building2,
  TrendingUp,
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts'
import { Button, Skeleton } from '../../components/ui'
import { ChartCard, DateRangeFilter } from '../../components/dashboard'
import { useRevenueReport, useLeadConversionReport, usePropertyReport } from '../../hooks/useReports'
import { reportsApi } from '../../api/reports'
import type { DateRangePreset } from '../../types/dashboard'
import type { RevenueReportParams, LeadConversionParams } from '../../types/reports'

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6']

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`
  return `$${value.toFixed(0)}`
}

function downloadBlob(data: Blob, filename: string) {
  const url = URL.createObjectURL(data)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

type Tab = 'revenue' | 'leads' | 'properties'

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('revenue')
  const [range, setRange] = useState<DateRangePreset>('this_month')
  const [exporting, setExporting] = useState(false)

  const revenueParams: RevenueReportParams = { range, groupBy: 'day' }
  const leadParams: LeadConversionParams = { range }

  const revenue = useRevenueReport(revenueParams)
  const leadConversion = useLeadConversionReport(leadParams)
  const propertyReport = usePropertyReport()

  const handleExportRevenue = useCallback(async () => {
    setExporting(true)
    try {
      const blob = await reportsApi.exportRevenueCsv(revenueParams)
      downloadBlob(blob, `revenue-report-${range}.csv`)
    } catch {
      // Fallback: generate CSV client-side from available data
      if (revenue.data?.data) {
        const header = 'Period,Revenue,Contracts,Avg Deal Size\n'
        const rows = revenue.data.data
          .map((r) => `${r.period},${r.revenue},${r.contracts},${r.avgDealSize}`)
          .join('\n')
        const blob = new Blob([header + rows], { type: 'text/csv' })
        downloadBlob(blob, `revenue-report-${range}.csv`)
      }
    } finally {
      setExporting(false)
    }
  }, [range, revenue.data, revenueParams])

  const handleExportLeads = useCallback(async () => {
    setExporting(true)
    try {
      const blob = await reportsApi.exportLeadsCsv(leadParams)
      downloadBlob(blob, `leads-report-${range}.csv`)
    } catch {
      if (leadConversion.data?.bySource) {
        const header = 'Source,Total,Converted,Conversion Rate %\n'
        const rows = leadConversion.data.bySource
          .map((r) => `${r.source},${r.total},${r.converted},${r.conversionRate}`)
          .join('\n')
        const blob = new Blob([header + rows], { type: 'text/csv' })
        downloadBlob(blob, `leads-report-${range}.csv`)
      }
    } finally {
      setExporting(false)
    }
  }, [range, leadConversion.data, leadParams])

  const tabs: { key: Tab; label: string; icon: typeof BarChart3 }[] = [
    { key: 'revenue', label: 'Revenue', icon: DollarSign },
    { key: 'leads', label: 'Lead Conversion', icon: Users },
    { key: 'properties', label: 'Properties', icon: Building2 },
  ]

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 size={24} className="text-indigo-500" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Reports</h1>
        </div>
        <DateRangeFilter value={range} onChange={setRange} />
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

      {/* Revenue Tab */}
      {activeTab === 'revenue' && (
        <div className="flex flex-col gap-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Revenue</p>
              <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">
                {revenue.data ? formatCurrency(revenue.data.total) : '--'}
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Contracts</p>
              <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">
                {revenue.data?.data
                  ? revenue.data.data.reduce((sum, r) => sum + r.contracts, 0)
                  : '--'}
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg Deal Size</p>
              <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">
                {revenue.data?.data?.length
                  ? formatCurrency(
                      revenue.data.data.reduce((sum, r) => sum + r.avgDealSize, 0) /
                        revenue.data.data.length,
                    )
                  : '--'}
              </p>
            </div>
          </div>

          {/* Revenue Timeline Chart */}
          <ChartCard
            title="Revenue Over Time"
            subtitle={revenue.data?.period ? `${revenue.data.period.start} — ${revenue.data.period.end}` : undefined}
            action={
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Download size={14} />}
                loading={exporting}
                onClick={handleExportRevenue}
              >
                Export CSV
              </Button>
            }
          >
            {revenue.isLoading ? (
              <Skeleton height="h-72" />
            ) : revenue.data?.data?.length ? (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenue.data.data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="reportRevenueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                    <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(value: unknown) => [formatCurrency(Number(value)), 'Revenue']}
                      contentStyle={{
                        backgroundColor: 'rgba(17, 24, 39, 0.9)',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#f9fafb',
                        fontSize: '12px',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#6366f1"
                      strokeWidth={2}
                      fill="url(#reportRevenueGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-72 items-center justify-center text-sm text-gray-400">
                No revenue data for this period
              </div>
            )}
          </ChartCard>

          {/* Revenue by Contracts Bar Chart */}
          <ChartCard title="Contracts & Average Deal Size">
            {revenue.isLoading ? (
              <Skeleton height="h-64" />
            ) : revenue.data?.data?.length ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenue.data.data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                    <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(17, 24, 39, 0.9)',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#f9fafb',
                        fontSize: '12px',
                      }}
                    />
                    <Legend />
                    <Bar dataKey="contracts" fill="#6366f1" name="Contracts" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="avgDealSize" fill="#22c55e" name="Avg Deal Size ($)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-64 items-center justify-center text-sm text-gray-400">
                No data available
              </div>
            )}
          </ChartCard>
        </div>
      )}

      {/* Lead Conversion Tab */}
      {activeTab === 'leads' && (
        <div className="flex flex-col gap-6">
          {/* Overall Stats */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Leads</p>
              <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">
                {leadConversion.data?.overall.total ?? '--'}
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Converted</p>
              <p className="mt-1 text-2xl font-bold text-green-600 dark:text-green-400">
                {leadConversion.data?.overall.converted ?? '--'}
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Conversion Rate</p>
                <TrendingUp size={14} className="text-green-500" />
              </div>
              <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">
                {leadConversion.data?.overall.conversionRate != null
                  ? `${leadConversion.data.overall.conversionRate}%`
                  : '--'}
              </p>
            </div>
          </div>

          {/* Lead Conversion by Source */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ChartCard
              title="Conversion by Source"
              action={
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<Download size={14} />}
                  loading={exporting}
                  onClick={handleExportLeads}
                >
                  Export CSV
                </Button>
              }
            >
              {leadConversion.isLoading ? (
                <Skeleton height="h-64" />
              ) : leadConversion.data?.bySource?.length ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={leadConversion.data.bySource}
                      layout="vertical"
                      margin={{ top: 5, right: 20, left: 60, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="source" tick={{ fontSize: 11 }} width={80} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(17, 24, 39, 0.9)',
                          border: 'none',
                          borderRadius: '8px',
                          color: '#f9fafb',
                          fontSize: '12px',
                        }}
                      />
                      <Legend />
                      <Bar dataKey="total" fill="#6366f1" name="Total" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="converted" fill="#22c55e" name="Converted" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex h-64 items-center justify-center text-sm text-gray-400">
                  No lead conversion data
                </div>
              )}
            </ChartCard>

            <ChartCard title="Conversion Rate by Source">
              {leadConversion.isLoading ? (
                <Skeleton height="h-64" />
              ) : leadConversion.data?.bySource?.length ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={leadConversion.data.bySource}
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        dataKey="converted"
                        nameKey="source"
                        label={({ payload }: { payload?: Record<string, unknown> }) => `${payload?.source ?? ''}: ${payload?.conversionRate ?? 0}%`}
                        labelLine={false}
                      >
                        {leadConversion.data.bySource.map((_, index) => (
                          <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(17, 24, 39, 0.9)',
                          border: 'none',
                          borderRadius: '8px',
                          color: '#f9fafb',
                          fontSize: '12px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex h-64 items-center justify-center text-sm text-gray-400">
                  No data available
                </div>
              )}
            </ChartCard>
          </div>

          {/* Conversion Table */}
          <ChartCard title="Detailed Conversion Breakdown">
            {leadConversion.isLoading ? (
              <Skeleton height="h-48" />
            ) : leadConversion.data?.bySource?.length ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-xs font-medium uppercase text-gray-500 dark:border-gray-700 dark:text-gray-400">
                      <th className="pb-3 pr-4">Source</th>
                      <th className="pb-3 pr-4 text-right">Total Leads</th>
                      <th className="pb-3 pr-4 text-right">Converted</th>
                      <th className="pb-3 text-right">Conversion Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leadConversion.data.bySource.map((item) => (
                      <tr
                        key={item.source}
                        className="border-b border-gray-100 last:border-0 dark:border-gray-700/50"
                      >
                        <td className="py-2.5 pr-4 font-medium text-gray-700 dark:text-gray-300">
                          {item.source}
                        </td>
                        <td className="py-2.5 pr-4 text-right text-gray-600 dark:text-gray-400">
                          {item.total}
                        </td>
                        <td className="py-2.5 pr-4 text-right text-green-600 dark:text-green-400">
                          {item.converted}
                        </td>
                        <td className="py-2.5 text-right font-medium text-gray-800 dark:text-gray-200">
                          {item.conversionRate}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-gray-400">No lead data available</p>
            )}
          </ChartCard>
        </div>
      )}

      {/* Properties Tab */}
      {activeTab === 'properties' && (
        <div className="flex flex-col gap-6">
          {/* Property Totals */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            {[
              { label: 'Total', value: propertyReport.data?.totals.total, color: 'text-gray-900 dark:text-gray-100' },
              { label: 'Available', value: propertyReport.data?.totals.available, color: 'text-green-600 dark:text-green-400' },
              { label: 'Sold', value: propertyReport.data?.totals.sold, color: 'text-indigo-600 dark:text-indigo-400' },
              { label: 'Rented', value: propertyReport.data?.totals.rented, color: 'text-amber-600 dark:text-amber-400' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800"
              >
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.label}</p>
                <p className={`mt-1 text-2xl font-bold ${stat.color}`}>
                  {stat.value ?? '--'}
                </p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Properties by Type - Bar Chart */}
            <ChartCard title="Properties by Type">
              {propertyReport.isLoading ? (
                <Skeleton height="h-64" />
              ) : propertyReport.data?.byType?.length ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={propertyReport.data.byType} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                      <XAxis dataKey="type" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(17, 24, 39, 0.9)',
                          border: 'none',
                          borderRadius: '8px',
                          color: '#f9fafb',
                          fontSize: '12px',
                        }}
                      />
                      <Bar dataKey="total" fill="#6366f1" name="Total" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="available" fill="#22c55e" name="Available" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="sold" fill="#f59e0b" name="Sold" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex h-64 items-center justify-center text-sm text-gray-400">
                  No property data
                </div>
              )}
            </ChartCard>

            {/* Properties by Type - Pie */}
            <ChartCard title="Distribution by Type">
              {propertyReport.isLoading ? (
                <Skeleton height="h-64" />
              ) : propertyReport.data?.byType?.length ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={propertyReport.data.byType}
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        dataKey="total"
                        nameKey="type"
                        label={({ payload }: { payload?: Record<string, unknown> }) => `${payload?.type ?? ''}: ${payload?.total ?? 0}`}
                        labelLine={false}
                      >
                        {propertyReport.data.byType.map((_, index) => (
                          <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(17, 24, 39, 0.9)',
                          border: 'none',
                          borderRadius: '8px',
                          color: '#f9fafb',
                          fontSize: '12px',
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex h-64 items-center justify-center text-sm text-gray-400">
                  No data available
                </div>
              )}
            </ChartCard>
          </div>

          {/* Detailed Table */}
          <ChartCard title="Property Details by Type">
            {propertyReport.isLoading ? (
              <Skeleton height="h-48" />
            ) : propertyReport.data?.byType?.length ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-xs font-medium uppercase text-gray-500 dark:border-gray-700 dark:text-gray-400">
                      <th className="pb-3 pr-4">Type</th>
                      <th className="pb-3 pr-4 text-right">Total</th>
                      <th className="pb-3 pr-4 text-right">Available</th>
                      <th className="pb-3 pr-4 text-right">Sold</th>
                      <th className="pb-3 pr-4 text-right">Rented</th>
                      <th className="pb-3 text-right">Avg Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {propertyReport.data.byType.map((item) => (
                      <tr
                        key={item.type}
                        className="border-b border-gray-100 last:border-0 dark:border-gray-700/50"
                      >
                        <td className="py-2.5 pr-4 font-medium text-gray-700 dark:text-gray-300">
                          {item.type}
                        </td>
                        <td className="py-2.5 pr-4 text-right text-gray-600 dark:text-gray-400">
                          {item.total}
                        </td>
                        <td className="py-2.5 pr-4 text-right text-green-600 dark:text-green-400">
                          {item.available}
                        </td>
                        <td className="py-2.5 pr-4 text-right text-indigo-600 dark:text-indigo-400">
                          {item.sold}
                        </td>
                        <td className="py-2.5 pr-4 text-right text-amber-600 dark:text-amber-400">
                          {item.rented}
                        </td>
                        <td className="py-2.5 text-right font-medium text-gray-800 dark:text-gray-200">
                          {formatCurrency(item.avgPrice)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-gray-400">No property data available</p>
            )}
          </ChartCard>
        </div>
      )}
    </div>
  )
}
