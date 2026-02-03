'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn, formatCurrency } from '@/lib/utils'
import { Facebook, Instagram, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import type { AdCampaign } from '@/types/marketing'

interface CampaignTableProps {
  campaigns: AdCampaign[]
  className?: string
}

type SortField = 'name' | 'spend' | 'leads' | 'cpl' | 'booked' | 'closed' | 'revenue' | 'roi'
type SortDirection = 'asc' | 'desc'

const statusVariants = {
  active: 'success',
  paused: 'warning',
  ended: 'secondary',
} as const

export function CampaignTable({ campaigns, className }: CampaignTableProps) {
  const [sortField, setSortField] = useState<SortField>('roi')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const sortedCampaigns = [...campaigns].sort((a, b) => {
    let aVal: number | string
    let bVal: number | string

    switch (sortField) {
      case 'name':
        aVal = a.name
        bVal = b.name
        break
      case 'spend':
        aVal = a.spend
        bVal = b.spend
        break
      case 'leads':
        aVal = a.leads
        bVal = b.leads
        break
      case 'cpl':
        aVal = a.cpl
        bVal = b.cpl
        break
      case 'booked':
        aVal = a.bookedCalls
        bVal = b.bookedCalls
        break
      case 'closed':
        aVal = a.closed
        bVal = b.closed
        break
      case 'revenue':
        aVal = a.revenue
        bVal = b.revenue
        break
      case 'roi':
        aVal = a.roi
        bVal = b.roi
        break
      default:
        return 0
    }

    if (typeof aVal === 'string') {
      return sortDirection === 'asc'
        ? aVal.localeCompare(bVal as string)
        : (bVal as string).localeCompare(aVal)
    }

    return sortDirection === 'asc' ? aVal - (bVal as number) : (bVal as number) - aVal
  })

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3 w-3 ml-1 text-slate-400" />
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="h-3 w-3 ml-1 text-slate-600" />
    ) : (
      <ArrowDown className="h-3 w-3 ml-1 text-slate-600" />
    )
  }

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center hover:text-slate-900 transition-colors"
    >
      {children}
      <SortIcon field={field} />
    </button>
  )

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">Campaign Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <SortableHeader field="name">Campaign</SortableHeader>
              </TableHead>
              <TableHead>Platform</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">
                <SortableHeader field="spend">Spend</SortableHeader>
              </TableHead>
              <TableHead className="text-right">
                <SortableHeader field="leads">Leads</SortableHeader>
              </TableHead>
              <TableHead className="text-right">
                <SortableHeader field="cpl">CPL</SortableHeader>
              </TableHead>
              <TableHead className="text-right">
                <SortableHeader field="booked">Booked</SortableHeader>
              </TableHead>
              <TableHead className="text-right">
                <SortableHeader field="closed">Closed</SortableHeader>
              </TableHead>
              <TableHead className="text-right">
                <SortableHeader field="revenue">Revenue</SortableHeader>
              </TableHead>
              <TableHead className="text-right">
                <SortableHeader field="roi">ROI</SortableHeader>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedCampaigns.map((campaign, index) => {
              const PlatformIcon = campaign.platform.name === 'Facebook' ? Facebook : Instagram
              const platformColor = campaign.platform.name === 'Facebook' ? 'text-[#1877F2]' : 'text-[#E4405F]'

              return (
                <TableRow key={campaign.id} className={index % 2 === 0 ? 'bg-slate-50/50' : ''}>
                  <TableCell className="font-medium">{campaign.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <PlatformIcon className={cn('h-4 w-4', platformColor)} />
                      <span className="text-sm text-slate-600">{campaign.platform.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariants[campaign.status]}>
                      {campaign.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(campaign.spend)}
                  </TableCell>
                  <TableCell className="text-right">{campaign.leads}</TableCell>
                  <TableCell className="text-right">{formatCurrency(campaign.cpl)}</TableCell>
                  <TableCell className="text-right">{campaign.bookedCalls}</TableCell>
                  <TableCell className="text-right">{campaign.closed}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(campaign.revenue)}
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={cn(
                        'font-bold',
                        campaign.roi >= 15 ? 'text-emerald-600' :
                        campaign.roi >= 10 ? 'text-emerald-500' :
                        campaign.roi >= 5 ? 'text-amber-600' :
                        'text-red-600'
                      )}
                    >
                      {campaign.roi.toFixed(1)}x
                    </span>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
