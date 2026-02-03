'use client'

import { useCalendlyData } from '@/hooks/use-calendly-data'
import { BookingAnalytics } from '@/components/calendly/booking-analytics'
import { TimeSlotHeatmap } from '@/components/calendly/time-slot-heatmap'
import { BookingTrendsChart } from '@/components/calendly/booking-trends-chart'
import { Card, CardContent } from '@/components/ui/card'
import { AlertCircle, Calendar, RefreshCw, ExternalLink } from 'lucide-react'
import { format } from 'date-fns'

export default function SchedulingPage() {
  const { data, isLoading, isError, refresh, isConfigured, lastFetched } = useCalendlyData()

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Scheduling</h1>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 w-20 rounded bg-slate-200" />
                  <div className="h-8 w-16 rounded bg-slate-200" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!isConfigured) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Scheduling</h1>
        </div>
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="rounded-full bg-amber-100 p-4 mb-4">
                <Calendar className="h-8 w-8 text-amber-600" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Calendly Not Configured</h2>
              <p className="text-slate-500 max-w-md mb-6">
                To view scheduling analytics, configure your Calendly integration by adding your
                API key and User URI to the environment variables.
              </p>
              <div className="rounded-lg bg-slate-50 p-4 text-left font-mono text-sm max-w-lg">
                <p className="text-slate-600"># Add to .env.local</p>
                <p className="mt-2">CALENDLY_API_KEY=your_api_key</p>
                <p>CALENDLY_USER_URI=https://api.calendly.com/users/your_user_id</p>
              </div>
              <a
                href="https://calendly.com/integrations/api_webhooks"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-500"
              >
                Get your Calendly API key
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Scheduling</h1>
        </div>
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="rounded-full bg-red-100 p-4 mb-4">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Error Loading Data</h2>
              <p className="text-slate-500 max-w-md mb-6">
                {isError.message || 'Failed to load Calendly data. Please try again.'}
              </p>
              <button
                onClick={() => refresh()}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-500"
              >
                <RefreshCw className="h-4 w-4" />
                Retry
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!data) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Scheduling</h1>
          <p className="text-sm text-slate-500">
            Calendly booking analytics and insights
          </p>
        </div>
        <div className="flex items-center gap-4">
          {lastFetched && (
            <span className="text-xs text-slate-400">
              Last updated: {format(new Date(lastFetched), 'h:mm a')}
            </span>
          )}
          <button
            onClick={() => refresh()}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <BookingAnalytics analytics={data.analytics} />

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <BookingTrendsChart data={data.analytics.dailyTrends} className="lg:col-span-2" />
      </div>

      {/* Time Slot Analysis */}
      <TimeSlotHeatmap
        timeSlotStats={data.analytics.timeSlotStats}
        topTimeSlots={data.analytics.topTimeSlots}
      />

      {/* Recent Bookings Table */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4">Recent Bookings</h3>
          {data.bookings.length === 0 ? (
            <p className="text-slate-500 text-center py-8">No bookings found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="py-3 px-2 text-left font-medium text-slate-600">Name</th>
                    <th className="py-3 px-2 text-left font-medium text-slate-600">Email</th>
                    <th className="py-3 px-2 text-left font-medium text-slate-600">Event</th>
                    <th className="py-3 px-2 text-left font-medium text-slate-600">Date</th>
                    <th className="py-3 px-2 text-left font-medium text-slate-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.bookings.slice(0, 20).map((booking) => (
                    <tr key={booking.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="py-3 px-2 font-medium">{booking.name || '-'}</td>
                      <td className="py-3 px-2 text-slate-600">{booking.email || '-'}</td>
                      <td className="py-3 px-2 text-slate-600">{booking.eventName}</td>
                      <td className="py-3 px-2 text-slate-600">
                        {format(new Date(booking.scheduledAt), 'MMM d, yyyy h:mm a')}
                      </td>
                      <td className="py-3 px-2">
                        <StatusBadge status={booking.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    scheduled: 'bg-blue-100 text-blue-700',
    attended: 'bg-green-100 text-green-700',
    no_show: 'bg-red-100 text-red-700',
    canceled: 'bg-slate-100 text-slate-700',
    rescheduled: 'bg-amber-100 text-amber-700',
  }

  const labels: Record<string, string> = {
    scheduled: 'Scheduled',
    attended: 'Attended',
    no_show: 'No Show',
    canceled: 'Canceled',
    rescheduled: 'Rescheduled',
  }

  return (
    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${styles[status] || styles.scheduled}`}>
      {labels[status] || status}
    </span>
  )
}
