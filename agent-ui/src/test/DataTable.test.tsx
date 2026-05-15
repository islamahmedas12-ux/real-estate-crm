import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DataTable } from '../components/ui/DataTable'
import type { Column } from '../types'

const mockColumns: Column<{ id: string; name: string; status: string }>[] = [
  { key: 'name', header: 'Name', sortable: true },
  { key: 'status', header: 'Status', sortable: false },
]

const mockData = [
  { id: '1', name: 'Alice', status: 'active' },
  { id: '2', name: 'Bob', status: 'inactive' },
]

describe('DataTable', () => {
  it('renders loading spinner when loading prop is true', () => {
    render(<DataTable columns={mockColumns} data={[]} loading />)
    expect(screen.getByText('Loading data...')).toBeInTheDocument()
  })

  it('renders empty state when no data and no loading', () => {
    render(
      <DataTable
        columns={mockColumns}
        data={[]}
        emptyTitle="No records"
        emptyDescription="Nothing to show"
      />
    )
    expect(screen.getByText('No records')).toBeInTheDocument()
  })

  it('renders all data rows', () => {
    render(<DataTable columns={mockColumns} data={mockData} />)
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
  })

  it('displays status for each row', () => {
    render(<DataTable columns={mockColumns} data={mockData} />)
    expect(screen.getByText('active')).toBeInTheDocument()
    expect(screen.getByText('inactive')).toBeInTheDocument()
  })
})