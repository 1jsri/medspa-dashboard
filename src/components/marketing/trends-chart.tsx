'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import type { TrendDataPoint } from '@/types/marketing'
import { format, parseISO } from 'date-fns'

interface TrendsChartProps {
  data: TrendDataPoint[]
  className?: string
}

export function TrendsChart({ data, className }: TrendsChartProps) {
  const chartData = data.map((item) => ({
    ...item,
    dateLabel: format(parseISO(item.date), 'MMM d'),
  }))

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">Lead Trends (Last 30 Days)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="dateLabel"
              tick={{ fontSize: 11 }}
              tickLine={false}
              interval="preserveStartEnd"
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
              formatter={(value: number, name: string) => {
                const labels: Record<string, string> = {
                  facebookLeads: 'Facebook',
                  instagramLeads: 'Instagram',
                }
                return [value, labels[name] || name]
              }}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Legend
              formatter={(value) => {
                const labels: Record<string, string> = {
                  facebookLeads: 'Facebook',
                  instagramLeads: 'Instagram',
                }
                return labels[value] || value
              }}
            />
            <Area
              type="monotone"
              dataKey="facebookLeads"
              stackId="1"
              stroke="#1877F2"
              fill="#1877F2"
              fillOpacity={0.6}
            />
            <Area
              type="monotone"
              dataKey="instagramLeads"
              stackId="1"
              stroke="#E4405F"
              fill="#E4405F"
              fillOpacity={0.6}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
