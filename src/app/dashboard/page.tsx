'use client'

import { useDashboardData } from '@/hooks/use-dashboard-data'
import { Header } from '@/components/layout/header'
import { KPICard } from '@/components/dashboard/kpi-card'
import { DashboardSkeleton } from '@/components/dashboard/loading-skeleton'
import { ConversionFunnel } from '@/components/charts/conversion-funnel'
import { RevenueChart } from '@/components/charts/revenue-chart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatPercent, formatDate } from '@/lib/utils'
import { Calendar, Users, TrendingUp, DollarSign, Target, Zap } from 'lucide-react'
import { DateRangeFilter } from '@/components/filters/date-range-filter'

export default function DashboardPage() {
  const { data, comparisons, isLoading, isError, dataSource } = useDashboardData()

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <Header title="Executive Summary" description="Overview of your MedSpa performance" />
        <div className="flex-1 p-4 md:p-6">
          <DashboardSkeleton />
        </div>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col h-full">
        <Header title="Executive Summary" />
        <div className="flex-1 p-4 md:p-6 flex items-center justify-center">
          <p className="text-slate-500">Failed to load data. Please try again.</p>
        </div>
      </div>
    )
  }

  const recentClients = data.clients.slice(0, 5)

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Executive Summary"
        description="Overview of your MedSpa performance"
        lastUpdated={data.lastUpdated}
        dataSource={dataSource}
        filterElement={<DateRangeFilter />}
      />
      <div className="flex-1 p-4 md:p-6 space-y-4 md:space-y-6 overflow-y-auto">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <KPICard
            title="Total Booked"
            value={data.kpis.totalBooked}
            description="Total consultation calls booked"
            icon={Calendar}
          />
          <KPICard
            title="Conversion Rate"
            value={formatPercent(data.kpis.conversionRate)}
            description="Booked to closed ratio"
            icon={Target}
            comparison={comparisons?.conversionRate}
          />
          <KPICard
            title="Total Revenue"
            value={formatCurrency(data.kpis.totalRevenue)}
            description="From closed deals"
            icon={DollarSign}
            comparison={comparisons?.totalRevenue}
          />
          <KPICard
            title="Avg Deal Size"
            value={formatCurrency(data.kpis.avgDealSize)}
            description="Average package value"
            icon={TrendingUp}
            comparison={comparisons?.avgDealSize}
          />
        </div>

        {/* Secondary KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
          <KPICard
            title="Attendance Rate"
            value={formatPercent(data.kpis.attendanceRate)}
            description={`${data.kpis.totalAttended} attended of ${data.kpis.totalBooked} booked`}
            icon={Users}
          />
          <KPICard
            title="Close Rate"
            value={formatPercent(data.kpis.closeRate)}
            description={`${data.kpis.totalClosed} closed of ${data.kpis.totalAttended} attended`}
            icon={Zap}
            comparison={comparisons?.closeRate}
          />
          <KPICard
            title="Cash Collected"
            value={formatCurrency(data.revenueData.cashCollected)}
            description={`${formatCurrency(data.revenueData.outstandingBalance)} outstanding`}
            icon={DollarSign}
            comparison={comparisons?.cashCollected}
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <ConversionFunnel stages={data.funnelStages} />
          <RevenueChart data={data.monthlyRevenue} />
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentClients.map((client, index) => (
                <div
                  key={client.email || `${client.name}-${index}`}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div>
                    <p className="font-medium text-slate-900">{client.name}</p>
                    <p className="text-sm text-slate-500">
                      {client.program || client.expectedPackage || 'No package'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={
                        client.journeyStage === 'paid'
                          ? 'success'
                          : client.journeyStage === 'closed'
                          ? 'info'
                          : client.journeyStage === 'attended'
                          ? 'warning'
                          : 'secondary'
                      }
                    >
                      {client.journeyStage}
                    </Badge>
                    {client.actualPrice > 0 && (
                      <span className="font-medium text-slate-900">
                        {formatCurrency(client.actualPrice)}
                      </span>
                    )}
                    <span className="text-xs text-slate-400">
                      {formatDate(client.bookingDate || client.purchaseDate || '')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
