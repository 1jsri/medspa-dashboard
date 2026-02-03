// Marketing dashboard types

export type AdPlatformName = 'Facebook' | 'Instagram'

export interface AdPlatform {
  id: string
  name: AdPlatformName
  icon: string
}

export type CampaignStatus = 'active' | 'paused' | 'ended'

export interface AdCampaign {
  id: string
  platform: AdPlatform
  name: string
  status: CampaignStatus
  spend: number
  impressions: number
  clicks: number
  leads: number
  ctr: number        // click-through rate
  cpl: number        // cost per lead
  bookedCalls: number
  attended: number
  closed: number
  revenue: number
  roi: number
}

export interface PlatformMetrics {
  platform: string
  leads: number
  spend: number
  cpl: number
  roi: number
}

export interface MarketingFunnelStage {
  stage: string
  count: number
  percentage: number
  dropOff: number
}

export interface TrendDataPoint {
  date: string
  leads: number
  spend: number
  facebookLeads: number
  instagramLeads: number
}

export interface MarketingMetrics {
  totalSpend: number
  totalLeads: number
  avgCPL: number
  blendedROI: number
  leadToBookedRate: number
  closeRate: number
  leadsByPlatform: PlatformMetrics[]
  funnelStages: MarketingFunnelStage[]
  campaignPerformance: AdCampaign[]
  trends: TrendDataPoint[]
  // Week-over-week changes
  wow: {
    leads: { value: number; isPositive: boolean }
    cpl: { value: number; isPositive: boolean }
    leadToBooked: { value: number; isPositive: boolean }
    closeRate: { value: number; isPositive: boolean }
    roi: { value: number; isPositive: boolean }
  }
}
