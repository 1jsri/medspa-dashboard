'use client'

import useSWR from 'swr'
import type { DashboardData, Client, CloserStats, FunnelStage, ActionItems } from '@/types/dashboard'
import { useAuth } from './use-auth'

export type DataSource = 'google-sheets' | 'excel' | 'demo'

interface ApiResponse extends DashboardData {
  _meta?: {
    dataSource: DataSource
    lastFetched: string
    error?: string
  }
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

// Filter clients by closer ID
function filterClientsByCloser(clients: Client[], closerId: string): Client[] {
  return clients.filter((c) => c.closer === closerId)
}

// Filter closer stats by closer ID
function filterCloserStats(stats: CloserStats[], closerId: string): CloserStats[] {
  return stats.filter((s) => s.name === closerId)
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
    percentage: total > 0 ? (s.count / total) * 100 : 0,
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

export function useDashboardData() {
  const { user, isRep } = useAuth()

  const { data, error, isLoading, mutate } = useSWR<ApiResponse>(
    '/api/sheets',
    fetcher,
    {
      refreshInterval: 60000, // Refresh every 60 seconds
      revalidateOnFocus: true,
      dedupingInterval: 30000,
    }
  )

  // Filter data based on user role
  const filteredData = data && isRep && user?.closerId
    ? filterDataForRep(data, user.closerId)
    : data

  return {
    data: filteredData,
    isLoading,
    isError: error,
    refresh: mutate,
    dataSource: data?._meta?.dataSource || 'demo',
  }
}
