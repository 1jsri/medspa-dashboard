import type { RawSheetsData, BookedCallRow, SaleSubmissionRow } from '@/types/sheets'
import type { Client, JourneyStage, DashboardData, CloserStats, FunnelStage, MonthlyRevenue, ActionItems } from '@/types/dashboard'
import { differenceInDays, parseISO, format, isAfter, subDays } from 'date-fns'
import { normalizeNameForMatching } from './excel-reader'
import { calculateMonthOverMonthTrends } from './trend-utils'

function determineJourneyStage(bookedCall: BookedCallRow | null, sale: SaleSubmissionRow | null): JourneyStage {
  if (sale && sale.cashCollected > 0) return 'paid'
  if (bookedCall?.closedStatus === 'Closed') return 'closed'
  if (bookedCall?.callStatus === 'Attended') return 'attended'
  return 'booked'
}

function calculateDaysToClose(bookedCall: BookedCallRow | null, sale: SaleSubmissionRow | null): number | null {
  if (!bookedCall?.bookingDate || !sale?.purchaseDate) return null
  try {
    const bookingDate = parseISO(bookedCall.bookingDate)
    const purchaseDate = parseISO(sale.purchaseDate)
    return differenceInDays(purchaseDate, bookingDate)
  } catch {
    return null
  }
}

export function mergeClientData(rawData: RawSheetsData): Client[] {
  // Create maps for matching by normalized name
  const clientMap = new Map<string, { bookedCall: BookedCallRow | null; sale: SaleSubmissionRow | null }>()

  // Add booked calls - match by normalized name
  for (const call of rawData.bookedCalls) {
    if (!call.clientName) continue
    const key = normalizeNameForMatching(call.clientName)
    if (!key) continue

    const existing = clientMap.get(key) || { bookedCall: null, sale: null }
    // Keep the most recent booked call if there are duplicates
    if (!existing.bookedCall || (call.callDate && call.callDate > (existing.bookedCall.callDate || ''))) {
      existing.bookedCall = call
    }
    clientMap.set(key, existing)
  }

  // Add sales - match by normalized name
  for (const sale of rawData.saleSubmissions) {
    if (!sale.clientName) continue
    const key = normalizeNameForMatching(sale.clientName)
    if (!key) continue

    const existing = clientMap.get(key) || { bookedCall: null, sale: null }
    // Keep the most recent sale if there are duplicates
    if (!existing.sale || (sale.purchaseDate && sale.purchaseDate > (existing.sale.purchaseDate || ''))) {
      existing.sale = sale
    }
    clientMap.set(key, existing)
  }

  // Transform to Client objects
  const clients: Client[] = []
  for (const [normalizedName, data] of clientMap) {
    const { bookedCall, sale } = data
    const journeyStage = determineJourneyStage(bookedCall, sale)

    // Use email from sale if available (booked calls don't have email)
    const email = sale?.clientEmail || bookedCall?.clientEmail || ''
    const name = bookedCall?.clientName || sale?.clientName || ''
    const phone = sale?.clientPhone || bookedCall?.clientPhone || ''

    // Get closer from sale (Sales Rep) or booked call
    const closer = sale?.closer || bookedCall?.closer || null

    clients.push({
      email,
      name,
      phone,
      bookingDate: sale?.bookingDate || bookedCall?.bookingDate || null,
      callDate: bookedCall?.callDate || null,
      callStatus: bookedCall?.callStatus || null,
      closer,
      setter: sale?.setter || bookedCall?.setter || null,
      expectedPackage: bookedCall?.expectedPackage || null,
      expectedPrice: bookedCall?.expectedPrice || 0,
      closedStatus: bookedCall?.closedStatus || null,
      purchaseDate: sale?.purchaseDate || null,
      program: sale?.program || null,
      actualPrice: sale?.price || 0,
      cashCollected: sale?.cashCollected || 0,
      balance: sale?.balance || 0,
      paymentMethod: sale?.paymentMethod || null,
      currency: sale?.currency || bookedCall?.currency || 'USD',
      journeyStage,
      daysToClose: calculateDaysToClose(bookedCall, sale),
      isConverted: journeyStage === 'closed' || journeyStage === 'paid',
      vibe: bookedCall?.vibe || null,
      objection: bookedCall?.objection || null,
      lastContact: bookedCall?.lastContact || null,
      lastContactNotes: bookedCall?.lastContactNotes || null,
      city: bookedCall?.city || null,
      state: bookedCall?.state || null,
      paymentStatus: sale?.paymentStatus || null,
      notes: bookedCall?.notes || sale?.notes || null,
    })
  }

  return clients.sort((a, b) => {
    const dateA = a.bookingDate || a.purchaseDate || ''
    const dateB = b.bookingDate || b.purchaseDate || ''
    return dateB.localeCompare(dateA)
  })
}

export function calculateCloserStats(clients: Client[]): CloserStats[] {
  const closerMap = new Map<string, Client[]>()

  for (const client of clients) {
    if (!client.closer) continue
    const existing = closerMap.get(client.closer) || []
    existing.push(client)
    closerMap.set(client.closer, existing)
  }

  const stats: CloserStats[] = []
  for (const [name, clientList] of closerMap) {
    const totalCalls = clientList.length
    const attended = clientList.filter(c => c.callStatus === 'Attended').length
    const closed = clientList.filter(c => c.isConverted).length
    const revenue = clientList.reduce((sum, c) => sum + c.actualPrice, 0)
    const cashCollected = clientList.reduce((sum, c) => sum + c.cashCollected, 0)

    stats.push({
      name,
      totalCalls,
      attended,
      closed,
      revenue,
      cashCollected,
      closeRate: attended > 0 ? closed / attended : 0,
      attendanceRate: totalCalls > 0 ? attended / totalCalls : 0,
      avgDealSize: closed > 0 ? revenue / closed : 0,
    })
  }

  return stats.sort((a, b) => b.revenue - a.revenue)
}

export function calculateFunnelStages(clients: Client[]): FunnelStage[] {
  const totalBooked = clients.length
  const attended = clients.filter(c => c.callStatus === 'Attended').length
  const closed = clients.filter(c => c.isConverted).length
  const paid = clients.filter(c => c.journeyStage === 'paid').length

  const stages = [
    { stage: 'Booked', count: totalBooked },
    { stage: 'Attended', count: attended },
    { stage: 'Closed', count: closed },
    { stage: 'Paid', count: paid },
  ]

  return stages.map((s, i) => ({
    ...s,
    percentage: totalBooked > 0 ? s.count / totalBooked : 0,
    dropOff: i > 0 ? stages[i - 1].count - s.count : 0,
  }))
}

export function calculateActionItems(clients: Client[]): ActionItems {
  const now = new Date()
  const sevenDaysAgo = subDays(now, 7)

  // No-Shows to Rescue: callStatus === 'No Show' and not rescheduled (closedStatus !== 'Closed')
  const noShowsToRescue = clients.filter(c =>
    c.callStatus === 'No Show' && c.closedStatus !== 'Closed'
  )

  // Warm Leads to Close: journeyStage === 'attended' (attended but not closed yet)
  const warmLeadsToClose = clients.filter(c =>
    c.journeyStage === 'attended' && c.closedStatus !== 'Closed'
  )

  // Unpaid Balances: balance > 0 (has been sold but still owes money)
  const unpaidBalances = clients.filter(c =>
    c.balance > 0
  )

  // Stale Leads: booked but call date is more than 7 days ago with no progress
  const staleLeads = clients.filter(c => {
    if (c.journeyStage !== 'booked') return false
    if (!c.bookingDate) return false
    try {
      const bookingDate = parseISO(c.bookingDate)
      return isAfter(sevenDaysAgo, bookingDate)
    } catch {
      return false
    }
  })

  return {
    noShowsToRescue,
    warmLeadsToClose,
    unpaidBalances,
    staleLeads,
  }
}

export function calculateMonthlyRevenue(clients: Client[]): MonthlyRevenue[] {
  const monthMap = new Map<string, { revenue: number; cashCollected: number; deals: number }>()

  for (const client of clients) {
    if (!client.purchaseDate || client.actualPrice === 0) continue
    try {
      const month = format(parseISO(client.purchaseDate), 'yyyy-MM')
      const existing = monthMap.get(month) || { revenue: 0, cashCollected: 0, deals: 0 }
      existing.revenue += client.actualPrice
      existing.cashCollected += client.cashCollected
      existing.deals += 1
      monthMap.set(month, existing)
    } catch {
      continue
    }
  }

  return Array.from(monthMap.entries())
    .map(([month, data]) => ({
      month,
      ...data,
    }))
    .sort((a, b) => a.month.localeCompare(b.month))
}

export function transformData(rawData: RawSheetsData): DashboardData {
  const clients = mergeClientData(rawData)
  const closerStats = calculateCloserStats(clients)
  const funnelStages = calculateFunnelStages(clients)
  const monthlyRevenue = calculateMonthlyRevenue(clients)
  const actionItems = calculateActionItems(clients)
  const kpiTrends = calculateMonthOverMonthTrends(monthlyRevenue)

  const totalBooked = clients.length
  const totalAttended = clients.filter(c => c.callStatus === 'Attended').length
  const totalClosed = clients.filter(c => c.isConverted).length
  const totalPaid = clients.filter(c => c.journeyStage === 'paid').length
  const totalRevenue = clients.reduce((sum, c) => sum + c.actualPrice, 0)
  const totalCashCollected = clients.reduce((sum, c) => sum + c.cashCollected, 0)
  const totalBalance = clients.reduce((sum, c) => sum + c.balance, 0)

  return {
    clients,
    closerStats,
    funnelStages,
    monthlyRevenue,
    actionItems,
    revenueData: {
      totalRevenue,
      cashCollected: totalCashCollected,
      outstandingBalance: totalBalance,
      avgDealSize: totalClosed > 0 ? totalRevenue / totalClosed : 0,
      totalDeals: totalClosed,
    },
    kpis: {
      totalBooked,
      totalAttended,
      totalClosed,
      totalPaid,
      conversionRate: totalBooked > 0 ? totalClosed / totalBooked : 0,
      attendanceRate: totalBooked > 0 ? totalAttended / totalBooked : 0,
      closeRate: totalAttended > 0 ? totalClosed / totalAttended : 0,
      totalRevenue,
      avgDealSize: totalClosed > 0 ? totalRevenue / totalClosed : 0,
    },
    kpiTrends,
    lastUpdated: rawData.lastUpdated,
  }
}
