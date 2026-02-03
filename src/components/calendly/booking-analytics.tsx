'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CalendlyAnalytics } from '@/types/calendly'
import { Calendar, Users, UserX, XCircle, TrendingUp } from 'lucide-react'

interface BookingAnalyticsProps {
  analytics: CalendlyAnalytics
  className?: string
}

interface KPICardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
}

function KPICard({ title, value, subtitle, icon, trend }: KPICardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {subtitle && (
              <p className="text-xs text-slate-400">{subtitle}</p>
            )}
          </div>
          <div className="rounded-full bg-slate-100 p-3 text-slate-600">
            {icon}
          </div>
        </div>
        {trend && (
          <div className={`mt-2 flex items-center gap-1 text-xs ${
            trend.isPositive ? 'text-green-600' : 'text-red-600'
          }`}>
            <TrendingUp className={`h-3 w-3 ${!trend.isPositive && 'rotate-180'}`} />
            <span>{trend.value.toFixed(1)}% from last period</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function BookingAnalytics({ analytics, className }: BookingAnalyticsProps) {
  const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`

  return (
    <div className={className}>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total Bookings"
          value={analytics.totalBookings}
          subtitle="Last 90 days"
          icon={<Calendar className="h-5 w-5" />}
        />
        <KPICard
          title="Avg per Day"
          value={analytics.avgBookingsPerDay}
          subtitle="On days with bookings"
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <KPICard
          title="No-Show Rate"
          value={formatPercent(analytics.noShowRate)}
          subtitle={`${analytics.noShowCount} no-shows`}
          icon={<UserX className="h-5 w-5" />}
        />
        <KPICard
          title="Cancellation Rate"
          value={formatPercent(analytics.cancellationRate)}
          subtitle={`${analytics.cancellationCount} cancellations`}
          icon={<XCircle className="h-5 w-5" />}
        />
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-green-100 p-3">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics.attendedCount}</p>
                <p className="text-sm text-slate-500">Attended</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-blue-100 p-3">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics.scheduledCount}</p>
                <p className="text-sm text-slate-500">Upcoming</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-amber-100 p-3">
                <UserX className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics.noShowCount}</p>
                <p className="text-sm text-slate-500">No-Shows</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
