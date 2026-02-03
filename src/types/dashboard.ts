// Transformed data types for dashboard display

import type { VibeType, ObjectionType } from './sheets'

// Comparison types for period-over-period analysis
export interface ComparisonResult {
  value: number         // percentage change for dollar amounts, point change for rates
  isPositive: boolean
  label: string         // "vs November 2023"
  type: 'percent' | 'points'  // how to display the change
}

export interface KPIComparisons {
  totalRevenue: ComparisonResult | null
  cashCollected: ComparisonResult | null
  avgDealSize: ComparisonResult | null
  conversionRate: ComparisonResult | null
  closeRate: ComparisonResult | null
}

export type JourneyStage = 'booked' | 'attended' | 'closed' | 'paid'

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

export interface Client {
  email: string
  name: string
  phone: string
  bookingDate: string | null
  callDate: string | null
  callStatus: string | null
  closer: string | null
  setter: string | null
  expectedPackage: string | null
  expectedPrice: number
  closedStatus: string | null
  purchaseDate: string | null
  program: string | null
  actualPrice: number
  cashCollected: number
  balance: number
  paymentMethod: string | null
  currency: string
  journeyStage: JourneyStage
  daysToClose: number | null
  isConverted: boolean
  vibe: VibeType
  objection: ObjectionType
  lastContact: string | null
  lastContactNotes: string | null
  city: string | null
  state: string | null
  paymentStatus: string | null
  notes: string | null
}

export interface CloserStats {
  name: string
  totalCalls: number
  attended: number
  closed: number
  revenue: number
  cashCollected: number
  closeRate: number
  attendanceRate: number
  avgDealSize: number
}

export interface FunnelStage {
  stage: string
  count: number
  percentage: number
  dropOff: number
}

export interface RevenueData {
  totalRevenue: number
  cashCollected: number
  outstandingBalance: number
  avgDealSize: number
  totalDeals: number
}

export interface MonthlyRevenue {
  month: string
  revenue: number
  cashCollected: number
  deals: number
}

export interface ActionItems {
  noShowsToRescue: Client[]
  warmLeadsToClose: Client[]
  unpaidBalances: Client[]
  staleLeads: Client[]
}

export interface DashboardData {
  clients: Client[]
  closerStats: CloserStats[]
  funnelStages: FunnelStage[]
  revenueData: RevenueData
  monthlyRevenue: MonthlyRevenue[]
  actionItems: ActionItems
  kpis: {
    totalBooked: number
    totalAttended: number
    totalClosed: number
    totalPaid: number
    conversionRate: number
    attendanceRate: number
    closeRate: number
    totalRevenue: number
    avgDealSize: number
  }
  kpiTrends: KPITrends
  lastUpdated: string
}
