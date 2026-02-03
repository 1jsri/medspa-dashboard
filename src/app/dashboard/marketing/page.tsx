'use client'

import { useMemo } from 'react'
import { Header } from '@/components/layout/header'
import { KPICard } from '@/components/dashboard/kpi-card'
import { PlatformCard } from '@/components/marketing/platform-card'
import { MarketingFunnelChart } from '@/components/marketing/funnel-chart'
import { CampaignTable } from '@/components/marketing/campaign-table'
import { TrendsChart } from '@/components/marketing/trends-chart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatPercent } from '@/lib/utils'
import { getMarketingDemoData } from '@/lib/marketing-demo-data'
import { Users, DollarSign, Target, TrendingUp, Percent } from 'lucide-react'

export default function MarketingPage() {
  // In the future, this will be replaced with real API data
  const data = useMemo(() => getMarketingDemoData(), [])

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Marketing"
        description="Ad performance and lead source attribution"
        dataSource="demo"
      />
      <div className="flex-1 p-4 md:p-6 space-y-4 md:space-y-6 overflow-y-auto">
        {/* Demo Data Banner */}
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="py-3">
            <div className="flex items-center gap-2">
              <Badge variant="warning">Demo Data</Badge>
              <span className="text-sm text-amber-800">
                Showing realistic demo data. Connect Meta Ads API for real metrics.
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Row 1: Health Scorecards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
          <KPICard
            title="Total Leads"
            value={data.totalLeads}
            description="From all ad platforms"
            icon={Users}
            trend={data.wow.leads}
          />
          <KPICard
            title="Cost per Lead"
            value={formatCurrency(data.avgCPL)}
            description="Blended across platforms"
            icon={DollarSign}
            trend={{
              value: data.wow.cpl.value,
              isPositive: !data.wow.cpl.isPositive, // Lower CPL is better
            }}
          />
          <KPICard
            title="Lead → Booked"
            value={formatPercent(data.leadToBookedRate)}
            description="Leads that book a call"
            icon={Target}
            trend={data.wow.leadToBooked}
          />
          <KPICard
            title="Close Rate"
            value={formatPercent(data.closeRate)}
            description="Attended to closed"
            icon={Percent}
            trend={data.wow.closeRate}
          />
          <KPICard
            title="Blended ROI"
            value={`${data.blendedROI.toFixed(1)}x`}
            description={`${formatCurrency(data.totalSpend)} → Revenue`}
            icon={TrendingUp}
            trend={data.wow.roi}
          />
        </div>

        {/* Row 2: Platform Comparison Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          {data.leadsByPlatform.map((platform) => (
            <PlatformCard key={platform.platform} metrics={platform} />
          ))}
        </div>

        {/* Row 3: Full Funnel Visualization */}
        <MarketingFunnelChart stages={data.funnelStages} />

        {/* Row 4: Campaign Performance Table */}
        <CampaignTable campaigns={data.campaignPerformance} />

        {/* Row 5: Trends Chart */}
        <TrendsChart data={data.trends} />
      </div>
    </div>
  )
}
