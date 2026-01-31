import type { MonthlyRevenue } from '@/types/dashboard'
import { format, subMonths, parseISO } from 'date-fns'

export interface TrendData {
  value: number
  isPositive: boolean
}

export interface KPITrends {
  revenue: TrendData | null
  deals: TrendData | null
  avgDealSize: TrendData | null
  cashCollected: TrendData | null
}

function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0
  }
  return ((current - previous) / previous) * 100
}

export function calculateMonthOverMonthTrends(monthlyRevenue: MonthlyRevenue[]): KPITrends {
  if (monthlyRevenue.length < 2) {
    return {
      revenue: null,
      deals: null,
      avgDealSize: null,
      cashCollected: null,
    }
  }

  // Sort by month to get most recent
  const sorted = [...monthlyRevenue].sort((a, b) => b.month.localeCompare(a.month))
  const currentMonth = sorted[0]
  const previousMonth = sorted[1]

  if (!currentMonth || !previousMonth) {
    return {
      revenue: null,
      deals: null,
      avgDealSize: null,
      cashCollected: null,
    }
  }

  const revenueChange = calculatePercentageChange(currentMonth.revenue, previousMonth.revenue)
  const dealsChange = calculatePercentageChange(currentMonth.deals, previousMonth.deals)
  const cashCollectedChange = calculatePercentageChange(currentMonth.cashCollected, previousMonth.cashCollected)

  const currentAvgDeal = currentMonth.deals > 0 ? currentMonth.revenue / currentMonth.deals : 0
  const previousAvgDeal = previousMonth.deals > 0 ? previousMonth.revenue / previousMonth.deals : 0
  const avgDealChange = calculatePercentageChange(currentAvgDeal, previousAvgDeal)

  return {
    revenue: {
      value: Math.round(revenueChange * 10) / 10,
      isPositive: revenueChange >= 0,
    },
    deals: {
      value: Math.round(dealsChange * 10) / 10,
      isPositive: dealsChange >= 0,
    },
    avgDealSize: {
      value: Math.round(avgDealChange * 10) / 10,
      isPositive: avgDealChange >= 0,
    },
    cashCollected: {
      value: Math.round(cashCollectedChange * 10) / 10,
      isPositive: cashCollectedChange >= 0,
    },
  }
}

export function getCurrentMonthLabel(monthlyRevenue: MonthlyRevenue[]): string {
  if (monthlyRevenue.length === 0) return ''

  const sorted = [...monthlyRevenue].sort((a, b) => b.month.localeCompare(a.month))
  const currentMonth = sorted[0]

  if (!currentMonth) return ''

  try {
    // Parse YYYY-MM format
    const date = parseISO(`${currentMonth.month}-01`)
    return format(date, 'MMMM yyyy')
  } catch {
    return currentMonth.month
  }
}

export function getPreviousMonthLabel(monthlyRevenue: MonthlyRevenue[]): string {
  if (monthlyRevenue.length < 2) return ''

  const sorted = [...monthlyRevenue].sort((a, b) => b.month.localeCompare(a.month))
  const previousMonth = sorted[1]

  if (!previousMonth) return ''

  try {
    const date = parseISO(`${previousMonth.month}-01`)
    return format(date, 'MMMM yyyy')
  } catch {
    return previousMonth.month
  }
}
