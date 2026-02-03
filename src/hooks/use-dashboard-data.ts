'use client'

import useSWR from 'swr'
import type { DashboardData, Client, CloserStats, FunnelStage, ActionItems, KPIComparisons } from '@/types/dashboard'
import { useAuth } from './use-auth'
import { useDateFilter } from '@/contexts/date-filter-context'
import { DateBounds, isDateInRange } from '@/lib/date-utils'
import { getComparisonPeriod, calculateComparison } from '@/lib/comparison-utils'

export type DataSource = 'google-sheets' | 'excel' | 'demo'

interface ApiResponse extends DashboardData {
  _meta?: {
    dataSource: DataSource
    lastFetched: string
    error?: string
  }
}

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    const error = new Error('Failed to fetch dashboard data')
    throw error
  }
  const data = await res.json()
  // Check if API returned an error response
  if (data.error) {
    const error = new Error(data.error)
    throw error
  }
  return data
}

// Filter clients by closer ID
function filterClientsByCloser(clients: Client[], closerId: string): Client[] {
  return clients.filter((c) => c.closer === closerId)
}

// Filter clients by date range
function filterClientsByDate(clients: Client[], bounds: DateBounds): Client[] {
  // If no bounds (all time), return all clients
  if (!bounds.start && !bounds.end) {
    return clients
  }

  return clients.filter((c) => {
    // Use bookingDate first (for leads), then purchaseDate (for closed deals), then callDate
    const dateToCheck = c.bookingDate || c.purchaseDate || c.callDate
    return isDateInRange(dateToCheck, bounds)
  })
}

// Filter closer stats by closer ID
function filterCloserStats(stats: CloserStats[], closerId: string): CloserStats[] {
  return stats.filter((s) => s.name === closerId)
}

// Recalculate closer stats from filtered clients
function recalculateCloserStats(clients: Client[]): CloserStats[] {
  const closerMap = new Map<string, {
    totalCalls: number
    attended: number
    closed: number
    noShows: number
    revenue: number
    cashCollected: number
  }>()

  clients.forEach((client) => {
    const closer = client.closer || 'Unknown'
    if (!closerMap.has(closer)) {
      closerMap.set(closer, {
        totalCalls: 0,
        attended: 0,
        closed: 0,
        noShows: 0,
        revenue: 0,
        cashCollected: 0,
      })
    }

    const stats = closerMap.get(closer)!
    stats.totalCalls++

    if (client.journeyStage === 'attended' || client.journeyStage === 'closed' || client.journeyStage === 'paid') {
      stats.attended++
    }

    if (client.journeyStage === 'closed' || client.journeyStage === 'paid') {
      stats.closed++
      stats.revenue += client.actualPrice || 0
      stats.cashCollected += client.cashCollected || 0
    }

    if (client.callStatus === 'No Show') {
      stats.noShows++
    }
  })

  return Array.from(closerMap.entries()).map(([name, stats]) => ({
    name,
    totalCalls: stats.totalCalls,
    attended: stats.attended,
    closed: stats.closed,
    noShows: stats.noShows,
    attendanceRate: stats.totalCalls > 0 ? stats.attended / stats.totalCalls : 0,
    closeRate: stats.attended > 0 ? stats.closed / stats.attended : 0,
    revenue: stats.revenue,
    cashCollected: stats.cashCollected,
    avgDealSize: stats.closed > 0 ? stats.revenue / stats.closed : 0,
  }))
}

// Filter action items by closer ID
function filterActionItems(actionItems: ActionItems, closerId: string): ActionItems {
  return {
    noShowsToRescue: actionItems.noShowsToRescue.filter((c) => c.closer === closerId),
    warmLeadsToClose: actionItems.warmLeadsToClose.filter((c) => c.closer === closerId),
    unpaidBalances: actionItems.unpaidBalances.filter((c) => c.closer === closerId),
    staleLeads: actionItems.staleLeads.filter((c) => c.closer === closerId),
  }
}

// Recalculate funnel stages from filtered clients
function recalculateFunnelStages(clients: Client[]): FunnelStage[] {
  const total = clients.length
  const booked = clients.filter((c) => c.journeyStage === 'booked' || c.journeyStage === 'attended' || c.journeyStage === 'closed' || c.journeyStage === 'paid').length
  const attended = clients.filter((c) => c.journeyStage === 'attended' || c.journeyStage === 'closed' || c.journeyStage === 'paid').length
  const closed = clients.filter((c) => c.journeyStage === 'closed' || c.journeyStage === 'paid').length
  const paid = clients.filter((c) => c.journeyStage === 'paid').length

  const stages = [
    { stage: 'Booked', count: booked },
    { stage: 'Attended', count: attended },
    { stage: 'Closed', count: closed },
    { stage: 'Paid', count: paid },
  ]

  return stages.map((s, i) => ({
    stage: s.stage,
    count: s.count,
    percentage: total > 0 ? s.count / total : 0,
    dropOff: i > 0 ? stages[i - 1].count - s.count : 0,
  }))
}

// Recalculate KPIs from filtered clients
function recalculateKPIs(clients: Client[]) {
  const booked = clients.filter((c) =>
    c.journeyStage === 'booked' || c.journeyStage === 'attended' ||
    c.journeyStage === 'closed' || c.journeyStage === 'paid'
  ).length
  const attended = clients.filter((c) =>
    c.journeyStage === 'attended' || c.journeyStage === 'closed' || c.journeyStage === 'paid'
  ).length
  const closed = clients.filter((c) =>
    c.journeyStage === 'closed' || c.journeyStage === 'paid'
  ).length
  const paid = clients.filter((c) => c.journeyStage === 'paid').length

  const totalRevenue = clients.reduce((sum, c) => sum + (c.actualPrice || 0), 0)
  const totalDeals = closed

  return {
    totalBooked: booked,
    totalAttended: attended,
    totalClosed: closed,
    totalPaid: paid,
    conversionRate: booked > 0 ? closed / booked : 0,
    attendanceRate: booked > 0 ? attended / booked : 0,
    closeRate: attended > 0 ? closed / attended : 0,
    totalRevenue,
    avgDealSize: totalDeals > 0 ? totalRevenue / totalDeals : 0,
  }
}

// Recalculate revenue data from filtered clients
function recalculateRevenueData(clients: Client[]) {
  const closedClients = clients.filter((c) =>
    c.journeyStage === 'closed' || c.journeyStage === 'paid'
  )

  const totalRevenue = closedClients.reduce((sum, c) => sum + (c.actualPrice || 0), 0)
  const cashCollected = closedClients.reduce((sum, c) => sum + (c.cashCollected || 0), 0)
  const outstandingBalance = closedClients.reduce((sum, c) => sum + (c.balance || 0), 0)
  const totalDeals = closedClients.length

  return {
    totalRevenue,
    cashCollected,
    outstandingBalance,
    avgDealSize: totalDeals > 0 ? totalRevenue / totalDeals : 0,
    totalDeals,
  }
}

// Filter dashboard data for a specific rep
function filterDataForRep(data: ApiResponse, closerId: string): ApiResponse {
  const filteredClients = filterClientsByCloser(data.clients, closerId)

  return {
    ...data,
    clients: filteredClients,
    closerStats: filterCloserStats(data.closerStats, closerId),
    funnelStages: recalculateFunnelStages(filteredClients),
    revenueData: recalculateRevenueData(filteredClients),
    actionItems: filterActionItems(data.actionItems, closerId),
    kpis: recalculateKPIs(filteredClients),
    // Keep monthly revenue and kpiTrends as-is for now (could be filtered in future)
  }
}

// Type guard to verify we have valid dashboard data
function isValidDashboardData(data: unknown): data is ApiResponse {
  return (
    data !== null &&
    typeof data === 'object' &&
    'clients' in data &&
    Array.isArray((data as ApiResponse).clients) &&
    'actionItems' in data &&
    typeof (data as ApiResponse).actionItems === 'object'
  )
}

// Filter and recalculate all data based on date range
function filterDataByDate(data: ApiResponse, bounds: DateBounds): ApiResponse {
  // If no bounds (all time), return data as-is
  if (!bounds.start && !bounds.end) {
    return data
  }

  const filteredClients = filterClientsByDate(data.clients, bounds)

  return {
    ...data,
    clients: filteredClients,
    closerStats: recalculateCloserStats(filteredClients),
    funnelStages: recalculateFunnelStages(filteredClients),
    revenueData: recalculateRevenueData(filteredClients),
    actionItems: {
      noShowsToRescue: data.actionItems.noShowsToRescue.filter(c => {
        const dateToCheck = c.bookingDate || c.purchaseDate || c.callDate
        return isDateInRange(dateToCheck, bounds)
      }),
      warmLeadsToClose: data.actionItems.warmLeadsToClose.filter(c => {
        const dateToCheck = c.bookingDate || c.purchaseDate || c.callDate
        return isDateInRange(dateToCheck, bounds)
      }),
      unpaidBalances: data.actionItems.unpaidBalances.filter(c => {
        const dateToCheck = c.bookingDate || c.purchaseDate || c.callDate
        return isDateInRange(dateToCheck, bounds)
      }),
      staleLeads: data.actionItems.staleLeads.filter(c => {
        const dateToCheck = c.bookingDate || c.purchaseDate || c.callDate
        return isDateInRange(dateToCheck, bounds)
      }),
    },
    kpis: recalculateKPIs(filteredClients),
  }
}

// Calculate KPI comparisons between current and previous period
function calculateKPIComparisons(
  currentKPIs: DashboardData['kpis'],
  currentRevenueData: DashboardData['revenueData'],
  previousKPIs: DashboardData['kpis'],
  previousRevenueData: DashboardData['revenueData'],
  comparisonLabel: string
): KPIComparisons {
  return {
    totalRevenue: calculateComparison(
      currentRevenueData.totalRevenue,
      previousRevenueData.totalRevenue,
      comparisonLabel,
      false
    ),
    cashCollected: calculateComparison(
      currentRevenueData.cashCollected,
      previousRevenueData.cashCollected,
      comparisonLabel,
      false
    ),
    avgDealSize: calculateComparison(
      currentRevenueData.avgDealSize,
      previousRevenueData.avgDealSize,
      comparisonLabel,
      false
    ),
    conversionRate: calculateComparison(
      currentKPIs.conversionRate,
      previousKPIs.conversionRate,
      comparisonLabel,
      true
    ),
    closeRate: calculateComparison(
      currentKPIs.closeRate,
      previousKPIs.closeRate,
      comparisonLabel,
      true
    ),
  }
}

export function useDashboardData() {
  const { user, isRep } = useAuth()
  const { dateBounds, filterState } = useDateFilter()

  const { data, error, isLoading } = useSWR<ApiResponse>(
    '/api/sheets',
    fetcher,
    {
      refreshInterval: 60000, // Refresh every 60 seconds
      revalidateOnFocus: true,
      dedupingInterval: 30000,
    }
  )

  // Apply filters in order: date filter first, then role filter
  let filteredData = data
  let comparisons: KPIComparisons | null = null

  // Only filter if we have valid dashboard data
  if (filteredData && isValidDashboardData(filteredData)) {
    // Apply date filter
    filteredData = filterDataByDate(filteredData, dateBounds)

    // Calculate comparison data
    const comparisonPeriod = getComparisonPeriod(filterState)
    if (comparisonPeriod && data) {
      // Get clients for comparison period
      let comparisonClients = filterClientsByDate(data.clients, comparisonPeriod.bounds)

      // Apply rep filter to comparison data if needed
      if (isRep && user?.closerId) {
        comparisonClients = filterClientsByCloser(comparisonClients, user.closerId)
      }

      const comparisonKPIs = recalculateKPIs(comparisonClients)
      const comparisonRevenueData = recalculateRevenueData(comparisonClients)

      comparisons = calculateKPIComparisons(
        filteredData.kpis,
        filteredData.revenueData,
        comparisonKPIs,
        comparisonRevenueData,
        comparisonPeriod.label
      )
    }

    // Apply role filter (rep can only see their own data)
    if (isRep && user?.closerId) {
      filteredData = filterDataForRep(filteredData, user.closerId)
    }
  }

  return {
    data: filteredData,
    comparisons,
    isLoading,
    isError: error,
    dataSource: data?._meta?.dataSource || 'demo',
  }
}
