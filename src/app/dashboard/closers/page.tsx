'use client'

import { useDashboardData } from '@/hooks/use-dashboard-data'
import { Header } from '@/components/layout/header'
import { DashboardSkeleton } from '@/components/dashboard/loading-skeleton'
import { CloserComparison } from '@/components/charts/closer-comparison'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrency, formatPercent } from '@/lib/utils'
import { Trophy, Medal, Award } from 'lucide-react'
import { DateRangeFilter } from '@/components/filters/date-range-filter'

export default function ClosersPage() {
  const { data, isLoading, isError, refresh, dataSource } = useDashboardData()

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <Header title="Closer Leaderboard" description="Performance comparison" />
        <div className="flex-1 p-6">
          <DashboardSkeleton />
        </div>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col h-full">
        <Header title="Closer Leaderboard" />
        <div className="flex-1 p-6 flex items-center justify-center">
          <p className="text-slate-500">Failed to load data. Please try again.</p>
        </div>
      </div>
    )
  }

  const sortedClosers = [...data.closerStats].sort((a, b) => b.revenue - a.revenue)
  const topRevenue = sortedClosers[0]
  const topCloseRate = [...data.closerStats].sort((a, b) => b.closeRate - a.closeRate)[0]
  const topDeals = [...data.closerStats].sort((a, b) => b.closed - a.closed)[0]

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Closer Leaderboard"
        description="Compare closer performance metrics"
        onRefresh={refresh}
        isLoading={isLoading}
        lastUpdated={data.lastUpdated}
        dataSource={dataSource}
        filterElement={<DateRangeFilter />}
      />
      <div className="flex-1 p-6 space-y-6 overflow-y-auto">
        {/* Top Performers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-amber-200 rounded-full">
                  <Trophy className="h-5 w-5 text-amber-700" />
                </div>
                <div>
                  <p className="text-xs text-amber-700 font-medium">Top Revenue</p>
                  <p className="text-lg font-bold text-amber-900">{topRevenue?.name || 'N/A'}</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-amber-900">
                {formatCurrency(topRevenue?.revenue || 0)}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-slate-200 rounded-full">
                  <Medal className="h-5 w-5 text-slate-700" />
                </div>
                <div>
                  <p className="text-xs text-slate-700 font-medium">Best Close Rate</p>
                  <p className="text-lg font-bold text-slate-900">{topCloseRate?.name || 'N/A'}</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900">
                {formatPercent(topCloseRate?.closeRate || 0)}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-rose-50 to-rose-100 border-rose-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-rose-200 rounded-full">
                  <Award className="h-5 w-5 text-rose-700" />
                </div>
                <div>
                  <p className="text-xs text-rose-700 font-medium">Most Deals</p>
                  <p className="text-lg font-bold text-rose-900">{topDeals?.name || 'N/A'}</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-rose-900">
                {topDeals?.closed || 0} deals
              </p>
            </CardContent>
          </Card>
        </div>

        <CloserComparison closers={data.closerStats} />

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Detailed Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Closer</TableHead>
                  <TableHead className="text-right">Total Calls</TableHead>
                  <TableHead className="text-right">Attended</TableHead>
                  <TableHead className="text-right">Closed</TableHead>
                  <TableHead className="text-right">Attendance Rate</TableHead>
                  <TableHead className="text-right">Close Rate</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Cash Collected</TableHead>
                  <TableHead className="text-right">Avg Deal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedClosers.map((closer, index) => (
                  <TableRow key={closer.name}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {index === 0 && <span className="text-amber-500">🥇</span>}
                        {index === 1 && <span className="text-slate-400">🥈</span>}
                        {index === 2 && <span className="text-amber-700">🥉</span>}
                        {closer.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{closer.totalCalls}</TableCell>
                    <TableCell className="text-right">{closer.attended}</TableCell>
                    <TableCell className="text-right">{closer.closed}</TableCell>
                    <TableCell className="text-right">{formatPercent(closer.attendanceRate)}</TableCell>
                    <TableCell className="text-right">
                      <span className={closer.closeRate >= 0.5 ? 'text-emerald-600 font-medium' : ''}>
                        {formatPercent(closer.closeRate)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(closer.revenue)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(closer.cashCollected)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(closer.avgDealSize)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
