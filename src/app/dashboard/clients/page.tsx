'use client'

import { useState, useMemo } from 'react'
import { useDashboardData } from '@/hooks/use-dashboard-data'
import { Header } from '@/components/layout/header'
import { DashboardSkeleton } from '@/components/dashboard/loading-skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrency, formatDate } from '@/lib/utils'
import { exportToCSV } from '@/lib/csv-export'
import { Search, Download } from 'lucide-react'
import { DateRangeFilter } from '@/components/filters/date-range-filter'
import { Button } from '@/components/ui/button'
import { Client, JourneyStage } from '@/types/dashboard'

type SortField = 'name' | 'bookingDate' | 'actualPrice' | 'journeyStage' | 'closer'
type SortDirection = 'asc' | 'desc'

const stageOrder: Record<JourneyStage, number> = {
  booked: 0,
  attended: 1,
  closed: 2,
  paid: 3,
}

export default function ClientsPage() {
  const { data, isLoading, isError, dataSource } = useDashboardData()
  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState<SortField>('bookingDate')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  const filteredAndSortedClients = useMemo(() => {
    if (!data) return []

    let clients = [...data.clients]

    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase()
      clients = clients.filter(
        (c) =>
          c.name.toLowerCase().includes(searchLower) ||
          c.email.toLowerCase().includes(searchLower) ||
          c.program?.toLowerCase().includes(searchLower) ||
          c.closer?.toLowerCase().includes(searchLower)
      )
    }

    // Sort
    clients.sort((a, b) => {
      let comparison = 0
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'bookingDate':
          comparison = (a.bookingDate || '').localeCompare(b.bookingDate || '')
          break
        case 'actualPrice':
          comparison = a.actualPrice - b.actualPrice
          break
        case 'journeyStage':
          comparison = stageOrder[a.journeyStage] - stageOrder[b.journeyStage]
          break
        case 'closer':
          comparison = (a.closer || '').localeCompare(b.closer || '')
          break
      }
      return sortDirection === 'asc' ? comparison : -comparison
    })

    return clients
  }, [data, search, sortField, sortDirection])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <TableHead
      className="cursor-pointer hover:bg-slate-50 select-none"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortField === field && (
          <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
        )}
      </div>
    </TableHead>
  )

  const getJourneyBadgeVariant = (stage: JourneyStage) => {
    switch (stage) {
      case 'paid':
        return 'success'
      case 'closed':
        return 'info'
      case 'attended':
        return 'warning'
      default:
        return 'secondary'
    }
  }

  const handleExportCSV = () => {
    const exportData = filteredAndSortedClients.map(client => ({
      name: client.name,
      email: client.email,
      phone: client.phone,
      bookingDate: client.bookingDate || '',
      closer: client.closer || '',
      program: client.program || client.expectedPackage || '',
      actualPrice: client.actualPrice,
      expectedPrice: client.expectedPrice,
      cashCollected: client.cashCollected,
      balance: client.balance,
      journeyStage: client.journeyStage,
      callStatus: client.callStatus || '',
      purchaseDate: client.purchaseDate || '',
      paymentMethod: client.paymentMethod || '',
      currency: client.currency,
    }))

    const columns = [
      { key: 'name' as const, label: 'Client Name' },
      { key: 'email' as const, label: 'Email' },
      { key: 'phone' as const, label: 'Phone' },
      { key: 'bookingDate' as const, label: 'Booking Date' },
      { key: 'closer' as const, label: 'Closer' },
      { key: 'program' as const, label: 'Program' },
      { key: 'actualPrice' as const, label: 'Actual Price' },
      { key: 'expectedPrice' as const, label: 'Expected Price' },
      { key: 'cashCollected' as const, label: 'Cash Collected' },
      { key: 'balance' as const, label: 'Balance' },
      { key: 'journeyStage' as const, label: 'Stage' },
      { key: 'callStatus' as const, label: 'Call Status' },
      { key: 'purchaseDate' as const, label: 'Purchase Date' },
      { key: 'paymentMethod' as const, label: 'Payment Method' },
      { key: 'currency' as const, label: 'Currency' },
    ]

    const timestamp = new Date().toISOString().split('T')[0]
    exportToCSV(exportData, `clients-export-${timestamp}.csv`, columns)
  }

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <Header title="Clients" description="All client records" />
        <div className="flex-1 p-4 md:p-6">
          <DashboardSkeleton />
        </div>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col h-full">
        <Header title="Clients" />
        <div className="flex-1 p-4 md:p-6 flex items-center justify-center">
          <p className="text-slate-500">Failed to load data. Please try again.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Clients"
        description={`${data.clients.length} total clients`}
        lastUpdated={data.lastUpdated}
        dataSource={dataSource}
        filterElement={<DateRangeFilter />}
      />
      <div className="flex-1 p-4 md:p-6 space-y-4 md:space-y-6 overflow-y-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Client List</CardTitle>
              <div className="flex items-center gap-3">
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search clients..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportCSV}
                  disabled={filteredAndSortedClients.length === 0}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableHeader field="name">Client</SortableHeader>
                  <SortableHeader field="bookingDate">Booking Date</SortableHeader>
                  <SortableHeader field="closer">Closer</SortableHeader>
                  <TableHead>Program</TableHead>
                  <SortableHeader field="actualPrice">Price</SortableHeader>
                  <TableHead className="text-right">Cash Collected</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <SortableHeader field="journeyStage">Stage</SortableHeader>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedClients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                      No clients found matching your search.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAndSortedClients.map((client, index) => (
                    <TableRow key={`${client.name}-${client.email}-${index}`}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{client.name}</p>
                          <p className="text-xs text-slate-500">{client.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {client.bookingDate ? formatDate(client.bookingDate) : '-'}
                      </TableCell>
                      <TableCell>{client.closer || '-'}</TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {client.program || client.expectedPackage || '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        {client.actualPrice > 0
                          ? formatCurrency(client.actualPrice)
                          : client.expectedPrice > 0
                          ? <span className="text-slate-400">{formatCurrency(client.expectedPrice)} (expected)</span>
                          : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        {client.cashCollected > 0
                          ? formatCurrency(client.cashCollected)
                          : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        {client.balance > 0 ? (
                          <span className="text-red-600 font-medium">
                            {formatCurrency(client.balance)}
                          </span>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getJourneyBadgeVariant(client.journeyStage)}>
                          {client.journeyStage}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            {filteredAndSortedClients.length > 0 && (
              <div className="mt-4 text-sm text-slate-500">
                Showing {filteredAndSortedClients.length} of {data.clients.length} clients
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
