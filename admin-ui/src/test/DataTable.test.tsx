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
  it('renders empty state message when no data', () => {
    render(
      <DataTable
        columns={mockColumns}
        data={[]}
        emptyMessage="No users found."
      />
    )
    expect(screen.getByText('No users found.')).toBeInTheDocument()
  })

  it('renders all data rows in card layout', () => {
    render(<DataTable columns={mockColumns} data={mockData} />)
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
  })

  it('displays correct status for each row', () => {
    render(<DataTable columns={mockColumns} data={mockData} />)
    expect(screen.getByText('active')).toBeInTheDocument()
    expect(screen.getByText('inactive')).toBeInTheDocument()
  })

  it('renders loading skeleton when loading prop is true', () => {
    render(<DataTable columns={mockColumns} data={[]} loading />)
    // Loading state should not show empty message
    expect(screen.queryByText('No records found.')).not.toBeInTheDocument()
  })
})