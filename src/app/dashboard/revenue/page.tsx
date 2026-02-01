'use client'

import { useDashboardData } from '@/hooks/use-dashboard-data'
import { Header } from '@/components/layout/header'
import { KPICard } from '@/components/dashboard/kpi-card'
import { DashboardSkeleton } from '@/components/dashboard/loading-skeleton'
import { RevenueChart } from '@/components/charts/revenue-chart'
import { PaymentBreakdown } from '@/components/charts/payment-breakdown'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrency } from '@/lib/utils'
import { exportToCSV } from '@/lib/csv-export'
import { Button } from '@/components/ui/button'
import { DollarSign, CreditCard, AlertCircle, TrendingUp, Download } from 'lucide-react'
import { DateRangeFilter } from '@/components/filters/date-range-filter'

export default function RevenuePage() {
  const { data, isLoading, isError, refresh, dataSource } = useDashboardData()

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <Header title="Revenue" description="Financial performance" />
        <div className="flex-1 p-6">
          <DashboardSkeleton />
        </div>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col h-full">
        <Header title="Revenue" />
        <div className="flex-1 p-6 flex items-center justify-center">
          <p className="text-slate-500">Failed to load data. Please try again.</p>
        </div>
      </div>
    )
  }

  const clientsWithBalance = data.clients.filter((c) => c.balance > 0)
  const collectionRate = data.revenueData.totalRevenue > 0
    ? data.revenueData.cashCollected / data.revenueData.totalRevenue
    : 0

  const handleExportOutstandingBalances = () => {
    const exportData = clientsWithBalance
      .sort((a, b) => b.balance - a.balance)
      .map(client => ({
        name: client.name,
        email: client.email,
        phone: client.phone,
        program: client.program || '',
        totalPrice: client.actualPrice,
        cashCollected: client.cashCollected,
        balance: client.balance,
        paymentMethod: client.paymentMethod || '',
        purchaseDate: client.purchaseDate || '',
      }))

    const columns = [
      { key: 'name' as const, label: 'Client Name' },
      { key: 'email' as const, label: 'Email' },
      { key: 'phone' as const, label: 'Phone' },
      { key: 'program' as const, label: 'Program' },
      { key: 'totalPrice' as const, label: 'Total Price' },
      { key: 'cashCollected' as const, label: 'Cash Collected' },
      { key: 'balance' as const, label: 'Outstanding Balance' },
      { key: 'paymentMethod' as const, label: 'Payment Method' },
      { key: 'purchaseDate' as const, label: 'Purchase Date' },
    ]

    const timestamp = new Date().toISOString().split('T')[0]
    exportToCSV(exportData, `outstanding-balances-${timestamp}.csv`, columns)
  }

  const handleExportMonthlyRevenue = () => {
    const exportData = data.monthlyRevenue.map(month => ({
      month: month.month,
      revenue: month.revenue,
      cashCollected: month.cashCollected,
      deals: month.deals,
      avgDealSize: month.deals > 0 ? Math.round(month.revenue / month.deals) : 0,
    }))

    const columns = [
      { key: 'month' as const, label: 'Month' },
      { key: 'revenue' as const, label: 'Total Revenue' },
      { key: 'cashCollected' as const, label: 'Cash Collected' },
      { key: 'deals' as const, label: 'Number of Deals' },
      { key: 'avgDealSize' as const, label: 'Avg Deal Size' },
    ]

    const timestamp = new Date().toISOString().split('T')[0]
    exportToCSV(exportData, `monthly-revenue-${timestamp}.csv`, columns)
  }

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Revenue"
        description="Track revenue, cash collection, and outstanding balances"
        onRefresh={refresh}
        isLoading={isLoading}
        lastUpdated={data.lastUpdated}
        dataSource={dataSource}
        filterElement={<DateRangeFilter />}
      />
      <div className="flex-1 p-6 space-y-6 overflow-y-auto">
        {/* Revenue KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Total Revenue"
            value={formatCurrency(data.revenueData.totalRevenue)}
            description={`${data.revenueData.totalDeals} closed deals`}
            icon={DollarSign}
            trend={data.kpiTrends?.revenue || undefined}
          />
          <KPICard
            title="Cash Collected"
            value={formatCurrency(data.revenueData.cashCollected)}
            description={`${(collectionRate * 100).toFixed(0)}% collection rate`}
            icon={CreditCard}
            trend={data.kpiTrends?.cashCollected || undefined}
          />
          <KPICard
            title="Outstanding Balance"
            value={formatCurrency(data.revenueData.outstandingBalance)}
            description={`${clientsWithBalance.length} clients with balance`}
            icon={AlertCircle}
          />
          <KPICard
            title="Avg Deal Size"
            value={formatCurrency(data.revenueData.avgDealSize)}
            description="Per closed deal"
            icon={TrendingUp}
            trend={data.kpiTrends?.avgDealSize || undefined}
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="relative">
            <RevenueChart data={data.monthlyRevenue} />
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportMonthlyRevenue}
              className="absolute top-4 right-4"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
          <PaymentBreakdown clients={data.clients} />
        </div>

        {/* Collection Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Collection Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 bg-emerald-50 rounded-lg">
                <p className="text-sm text-emerald-700 font-medium">Fully Paid</p>
                <p className="text-2xl font-bold text-emerald-900 mt-1">
                  {data.clients.filter((c) => c.actualPrice > 0 && c.balance === 0).length}
                </p>
                <p className="text-xs text-emerald-600 mt-1">clients with zero balance</p>
              </div>
              <div className="p-4 bg-amber-50 rounded-lg">
                <p className="text-sm text-amber-700 font-medium">Partial Payment</p>
                <p className="text-2xl font-bold text-amber-900 mt-1">
                  {clientsWithBalance.length}
                </p>
                <p className="text-xs text-amber-600 mt-1">clients with outstanding balance</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700 font-medium">Collection Rate</p>
                <p className="text-2xl font-bold text-blue-900 mt-1">
                  {(collectionRate * 100).toFixed(1)}%
                </p>
                <p className="text-xs text-blue-600 mt-1">of total revenue collected</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Outstanding Balances */}
        {clientsWithBalance.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Outstanding Balances</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportOutstandingBalances}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Program</TableHead>
                    <TableHead className="text-right">Total Price</TableHead>
                    <TableHead className="text-right">Cash Collected</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead>Payment Method</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientsWithBalance
                    .sort((a, b) => b.balance - a.balance)
                    .map((client, index) => (
                      <TableRow key={client.email || `${client.name}-${index}`}>
                        <TableCell className="font-medium">{client.name}</TableCell>
                        <TableCell>{client.program || 'N/A'}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(client.actualPrice)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(client.cashCollected)}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-red-600 font-medium">
                            {formatCurrency(client.balance)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{client.paymentMethod || 'Unknown'}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
