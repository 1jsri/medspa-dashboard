'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { DailyBookingTrend } from '@/types/calendly'
import { format, parseISO } from 'date-fns'

interface BookingTrendsChartProps {
  data: DailyBookingTrend[]
  className?: string
}

export function BookingTrendsChart({ data, className }: BookingTrendsChartProps) {
  // Group data by week for better visualization if there's too much data
  const chartData = data.length > 30
    ? aggregateByWeek(data)
    : data.map(item => ({
        ...item,
        label: format(parseISO(item.date), 'MMM d'),
      }))

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">Booking Trends</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="flex h-[300px] items-center justify-center text-slate-500">
            No booking data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11 }}
                tickLine={false}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                }}
                formatter={(value: number) => [value, 'Bookings']}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Bar
                dataKey="count"
                name="Bookings"
                fill="#6366f1"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}

// Helper function to aggregate daily data into weekly
function aggregateByWeek(data: DailyBookingTrend[]): Array<{ label: string; count: number }> {
  const weekMap = new Map<string, number>()

  for (const item of data) {
    const date = parseISO(item.date)
    // Get the week start (Sunday)
    const weekStart = new Date(date)
    weekStart.setDate(date.getDate() - date.getDay())
    const weekKey = format(weekStart, 'yyyy-MM-dd')

    weekMap.set(weekKey, (weekMap.get(weekKey) || 0) + item.count)
  }

  return Array.from(weekMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({
      label: `Week of ${format(parseISO(date), 'MMM d')}`,
      count,
    }))
}
