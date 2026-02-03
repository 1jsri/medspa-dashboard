// Demo data for marketing dashboard
// Realistic mock data showing Facebook + Instagram performance

import type { MarketingMetrics, AdCampaign, AdPlatform, TrendDataPoint } from '@/types/marketing'

const facebookPlatform: AdPlatform = {
  id: 'fb',
  name: 'Facebook',
  icon: 'facebook',
}

const instagramPlatform: AdPlatform = {
  id: 'ig',
  name: 'Instagram',
  icon: 'instagram',
}

// Generate 30 days of trend data
function generateTrendData(): TrendDataPoint[] {
  const trends: TrendDataPoint[] = []
  const today = new Date()

  for (let i = 29; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)

    // Add some realistic variation
    const dayOfWeek = date.getDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    const baseMultiplier = isWeekend ? 0.7 : 1.0

    // Facebook: higher volume
    const fbLeads = Math.floor((8 + Math.random() * 6) * baseMultiplier)
    const fbSpend = 150 + Math.random() * 50

    // Instagram: lower volume but present
    const igLeads = Math.floor((3 + Math.random() * 4) * baseMultiplier)
    const igSpend = 80 + Math.random() * 30

    trends.push({
      date: date.toISOString().split('T')[0],
      leads: fbLeads + igLeads,
      spend: Math.round(fbSpend + igSpend),
      facebookLeads: fbLeads,
      instagramLeads: igLeads,
    })
  }

  return trends
}

// Facebook campaigns - higher volume, lower CPL, ~16x ROI
const facebookCampaigns: AdCampaign[] = [
  {
    id: 'fb-1',
    platform: facebookPlatform,
    name: 'Body Contouring - LA Metro',
    status: 'active',
    spend: 2450,
    impressions: 185000,
    clicks: 3700,
    leads: 74,
    ctr: 2.0,
    cpl: 33.11,
    bookedCalls: 52,
    attended: 41,
    closed: 18,
    revenue: 45000,
    roi: 17.4,
  },
  {
    id: 'fb-2',
    platform: facebookPlatform,
    name: 'Facial Rejuvenation - Women 35-54',
    status: 'active',
    spend: 1890,
    impressions: 142000,
    clicks: 2840,
    leads: 57,
    ctr: 2.0,
    cpl: 33.16,
    bookedCalls: 40,
    attended: 32,
    closed: 14,
    revenue: 35000,
    roi: 17.5,
  },
  {
    id: 'fb-3',
    platform: facebookPlatform,
    name: 'Weight Loss - Retargeting',
    status: 'active',
    spend: 980,
    impressions: 45000,
    clicks: 1350,
    leads: 32,
    ctr: 3.0,
    cpl: 30.63,
    bookedCalls: 24,
    attended: 20,
    closed: 10,
    revenue: 18000,
    roi: 17.4,
  },
  {
    id: 'fb-4',
    platform: facebookPlatform,
    name: 'Summer Special - Lookalike',
    status: 'paused',
    spend: 650,
    impressions: 52000,
    clicks: 780,
    leads: 18,
    ctr: 1.5,
    cpl: 36.11,
    bookedCalls: 12,
    attended: 9,
    closed: 3,
    revenue: 6000,
    roi: 8.2,
  },
]

// Instagram campaigns - lower volume, higher CPL, ~11x ROI
const instagramCampaigns: AdCampaign[] = [
  {
    id: 'ig-1',
    platform: instagramPlatform,
    name: 'Before/After Stories',
    status: 'active',
    spend: 1250,
    impressions: 89000,
    clicks: 2670,
    leads: 28,
    ctr: 3.0,
    cpl: 44.64,
    bookedCalls: 18,
    attended: 14,
    closed: 6,
    revenue: 15000,
    roi: 11.0,
  },
  {
    id: 'ig-2',
    platform: instagramPlatform,
    name: 'Influencer Collab - Skin Care',
    status: 'active',
    spend: 890,
    impressions: 67000,
    clicks: 1675,
    leads: 19,
    ctr: 2.5,
    cpl: 46.84,
    bookedCalls: 12,
    attended: 10,
    closed: 4,
    revenue: 10000,
    roi: 10.2,
  },
  {
    id: 'ig-3',
    platform: instagramPlatform,
    name: 'Reels - Treatment Process',
    status: 'active',
    spend: 560,
    impressions: 125000,
    clicks: 2500,
    leads: 14,
    ctr: 2.0,
    cpl: 40.00,
    bookedCalls: 10,
    attended: 8,
    closed: 4,
    revenue: 8000,
    roi: 13.3,
  },
]

export function getMarketingDemoData(): MarketingMetrics {
  const allCampaigns = [...facebookCampaigns, ...instagramCampaigns]

  // Calculate totals
  const totalSpend = allCampaigns.reduce((sum, c) => sum + c.spend, 0)
  const totalLeads = allCampaigns.reduce((sum, c) => sum + c.leads, 0)
  const totalBookedCalls = allCampaigns.reduce((sum, c) => sum + c.bookedCalls, 0)
  const totalAttended = allCampaigns.reduce((sum, c) => sum + c.attended, 0)
  const totalClosed = allCampaigns.reduce((sum, c) => sum + c.closed, 0)
  const totalRevenue = allCampaigns.reduce((sum, c) => sum + c.revenue, 0)
  const totalClicks = allCampaigns.reduce((sum, c) => sum + c.clicks, 0)

  // Platform breakdowns
  const fbCampaigns = allCampaigns.filter(c => c.platform.name === 'Facebook')
  const igCampaigns = allCampaigns.filter(c => c.platform.name === 'Instagram')

  const fbSpend = fbCampaigns.reduce((sum, c) => sum + c.spend, 0)
  const fbLeads = fbCampaigns.reduce((sum, c) => sum + c.leads, 0)
  const fbRevenue = fbCampaigns.reduce((sum, c) => sum + c.revenue, 0)

  const igSpend = igCampaigns.reduce((sum, c) => sum + c.spend, 0)
  const igLeads = igCampaigns.reduce((sum, c) => sum + c.leads, 0)
  const igRevenue = igCampaigns.reduce((sum, c) => sum + c.revenue, 0)

  // Funnel stages
  const funnelStages = [
    {
      stage: 'Ad Clicks',
      count: totalClicks,
      percentage: 1,
      dropOff: 0,
    },
    {
      stage: 'Leads',
      count: totalLeads,
      percentage: totalLeads / totalClicks,
      dropOff: totalClicks - totalLeads,
    },
    {
      stage: 'Booked',
      count: totalBookedCalls,
      percentage: totalBookedCalls / totalClicks,
      dropOff: totalLeads - totalBookedCalls,
    },
    {
      stage: 'Attended',
      count: totalAttended,
      percentage: totalAttended / totalClicks,
      dropOff: totalBookedCalls - totalAttended,
    },
    {
      stage: 'Closed',
      count: totalClosed,
      percentage: totalClosed / totalClicks,
      dropOff: totalAttended - totalClosed,
    },
    {
      stage: 'Paid',
      count: Math.floor(totalClosed * 0.85), // 85% payment rate
      percentage: (totalClosed * 0.85) / totalClicks,
      dropOff: Math.floor(totalClosed * 0.15),
    },
  ]

  return {
    totalSpend,
    totalLeads,
    avgCPL: totalSpend / totalLeads,
    blendedROI: totalRevenue / totalSpend,
    leadToBookedRate: totalBookedCalls / totalLeads,
    closeRate: totalClosed / totalAttended,
    leadsByPlatform: [
      {
        platform: 'Facebook',
        leads: fbLeads,
        spend: fbSpend,
        cpl: fbSpend / fbLeads,
        roi: fbRevenue / fbSpend,
      },
      {
        platform: 'Instagram',
        leads: igLeads,
        spend: igSpend,
        cpl: igSpend / igLeads,
        roi: igRevenue / igSpend,
      },
    ],
    funnelStages,
    campaignPerformance: allCampaigns,
    trends: generateTrendData(),
    wow: {
      leads: { value: 12.5, isPositive: true },
      cpl: { value: 8.2, isPositive: false }, // Lower CPL is better, so negative change is positive
      leadToBooked: { value: 3.1, isPositive: true },
      closeRate: { value: 2.4, isPositive: true },
      roi: { value: 5.8, isPositive: true },
    },
  }
}
