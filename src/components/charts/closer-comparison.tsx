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
  Legend,
} from 'recharts'
import { CloserStats } from '@/types/dashboard'
import { formatCurrency, formatPercent } from '@/lib/utils'

interface CloserComparisonProps {
  closers: CloserStats[]
  className?: string
}

export function CloserComparison({ closers, className }: CloserComparisonProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">Closer Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={closers} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis type="number" tick={{ fontSize: 12 }} tickLine={false} />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 12 }}
              tickLine={false}
              width={80}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Bar dataKey="totalCalls" name="Total Calls" fill="#94a3b8" radius={[0, 4, 4, 0]} />
            <Bar dataKey="attended" name="Attended" fill="#6366f1" radius={[0, 4, 4, 0]} />
            <Bar dataKey="closed" name="Closed" fill="#10b981" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-6 grid grid-cols-2 gap-4">
          {closers.map((closer) => (
            <div key={closer.name} className="rounded-lg border p-4">
              <h4 className="font-semibold text-slate-900">{closer.name}</h4>
              <dl className="mt-2 space-y-1 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-500">Close Rate</dt>
                  <dd className="font-medium text-emerald-600">
                    {formatPercent(closer.closeRate)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Revenue</dt>
                  <dd className="font-medium text-slate-900">
                    {formatCurrency(closer.revenue)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Avg Deal</dt>
                  <dd className="font-medium text-slate-900">
                    {formatCurrency(closer.avgDealSize)}
                  </dd>
                </div>
              </dl>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
