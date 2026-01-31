'use client'

import { useDashboardData } from '@/hooks/use-dashboard-data'
import { Header } from '@/components/layout/header'
import { DashboardSkeleton } from '@/components/dashboard/loading-skeleton'
import { ConversionFunnel } from '@/components/charts/conversion-funnel'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
} from '@/components/ui/drawer'
import * as VisuallyHidden from '@radix-ui/react-visually-hidden'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatPercent } from '@/lib/utils'
import { PipelineProvider, usePipelineContext, type PipelineFilter } from '@/components/pipeline/pipeline-context'
import { ClientListPanel } from '@/components/pipeline/client-list-panel'
import { ClientDrawer } from '@/components/pipeline/client-drawer'
import { ActionItems } from '@/components/pipeline/action-items'
import type { JourneyStage, DashboardData } from '@/types/dashboard'

function PipelineContent({ data }: { data: DashboardData }) {
  const {
    openDrawer,
    isDrawerOpen,
    closeDrawer,
    selectedClient,
    filter,
  } = usePipelineContext()

  const handleStageClick = (stage: JourneyStage) => {
    const stageLabels: Record<JourneyStage, string> = {
      booked: 'Booked Clients',
      attended: 'Attended Clients',
      closed: 'Closed Clients',
      paid: 'Paid Clients',
    }
    openDrawer({
      type: 'stage',
      value: stage,
      label: stageLabels[stage],
    })
  }

  const handleDropOffClick = (stage: JourneyStage) => {
    const dropOffLabels: Record<JourneyStage, string> = {
      booked: 'Booked Drop-offs',
      attended: 'Didn\'t Attend',
      closed: 'Didn\'t Close',
      paid: 'Not Yet Paid',
    }
    openDrawer({
      type: 'dropOff',
      value: stage,
      label: dropOffLabels[stage],
    })
  }

  const handleCallStatusClick = (status: string) => {
    openDrawer({
      type: 'callStatus',
      value: status,
      label: `${status} Calls`,
    })
  }

  const handleNoShowsClick = () => {
    openDrawer({
      type: 'actionNoShows',
      value: null,
      label: 'No-Shows to Rescue',
    })
  }

  const handleWarmLeadsClick = () => {
    openDrawer({
      type: 'actionWarmLeads',
      value: null,
      label: 'Warm Leads to Close',
    })
  }

  const handleUnpaidClick = () => {
    openDrawer({
      type: 'actionUnpaid',
      value: null,
      label: 'Unpaid Balances',
    })
  }

  const handleStaleClick = () => {
    openDrawer({
      type: 'actionStale',
      value: null,
      label: 'Stale Leads (7+ Days)',
    })
  }

  const stageBreakdown = [
    {
      stage: 'Booked',
      journeyStage: 'booked' as JourneyStage,
      total: data.kpis.totalBooked,
      description: 'Clients who scheduled a consultation call',
      nextStage: 'Attended',
      dropOff: data.kpis.totalBooked - data.kpis.totalAttended,
      dropOffRate: 1 - data.kpis.attendanceRate,
      dropOffStage: 'attended' as JourneyStage,
    },
    {
      stage: 'Attended',
      journeyStage: 'attended' as JourneyStage,
      total: data.kpis.totalAttended,
      description: 'Clients who showed up for their call',
      nextStage: 'Closed',
      dropOff: data.kpis.totalAttended - data.kpis.totalClosed,
      dropOffRate: 1 - data.kpis.closeRate,
      dropOffStage: 'closed' as JourneyStage,
    },
    {
      stage: 'Closed',
      journeyStage: 'closed' as JourneyStage,
      total: data.kpis.totalClosed,
      description: 'Clients who purchased a package',
      nextStage: 'Paid',
      dropOff: data.kpis.totalClosed - data.kpis.totalPaid,
      dropOffRate: data.kpis.totalClosed > 0 ? 1 - (data.kpis.totalPaid / data.kpis.totalClosed) : 0,
      dropOffStage: 'paid' as JourneyStage,
    },
    {
      stage: 'Paid',
      journeyStage: 'paid' as JourneyStage,
      total: data.kpis.totalPaid,
      description: 'Clients who have made a payment',
      nextStage: null,
      dropOff: 0,
      dropOffRate: 0,
      dropOffStage: null,
    },
  ]

  const callStatusBreakdown = data.clients.reduce((acc, client) => {
    const status = client.callStatus || 'Unknown'
    acc[status] = (acc[status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <>
      <div className="flex-1 p-6 space-y-6 overflow-y-auto">
        {/* Action Items */}
        <ActionItems
          actionItems={data.actionItems}
          onNoShowsClick={handleNoShowsClick}
          onWarmLeadsClick={handleWarmLeadsClick}
          onUnpaidClick={handleUnpaidClick}
          onStaleClick={handleStaleClick}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ConversionFunnel
            stages={data.funnelStages}
            onStageClick={handleStageClick}
            onDropOffClick={handleDropOffClick}
          />

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Call Status Breakdown</CardTitle>
              <p className="text-sm text-slate-500">Click any status to view clients</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(callStatusBreakdown).map(([status, count]) => {
                  const percentage = data.kpis.totalBooked > 0 ? count / data.kpis.totalBooked : 0
                  return (
                    <button
                      key={status}
                      onClick={() => handleCallStatusClick(status)}
                      className="flex items-center justify-between w-full hover:bg-slate-50 p-2 rounded-lg transition-colors -mx-2"
                    >
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            status === 'Attended'
                              ? 'success'
                              : status === 'No Show'
                              ? 'destructive'
                              : status === 'Cancelled'
                              ? 'destructive'
                              : status === 'Rescheduled'
                              ? 'warning'
                              : 'secondary'
                          }
                        >
                          {status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-medium">{count}</span>
                        <span className="text-sm text-slate-500 w-16 text-right">
                          {formatPercent(percentage)}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Stage Breakdown</CardTitle>
            <p className="text-sm text-slate-500">Click any row to view clients</p>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Stage</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Count</TableHead>
                  <TableHead className="text-right">Drop-off</TableHead>
                  <TableHead className="text-right">Drop-off Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stageBreakdown.map((stage) => (
                  <TableRow
                    key={stage.stage}
                    className="cursor-pointer hover:bg-slate-50"
                    onClick={() => handleStageClick(stage.journeyStage)}
                  >
                    <TableCell className="font-medium">{stage.stage}</TableCell>
                    <TableCell className="text-slate-500">{stage.description}</TableCell>
                    <TableCell className="text-right font-medium">{stage.total}</TableCell>
                    <TableCell className="text-right">
                      {stage.dropOff > 0 ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            if (stage.dropOffStage) {
                              handleDropOffClick(stage.dropOffStage)
                            }
                          }}
                          className="text-red-600 hover:text-red-800 hover:underline"
                        >
                          -{stage.dropOff}
                        </button>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {stage.dropOffRate > 0 ? (
                        <span className="text-red-600">{formatPercent(stage.dropOffRate)}</span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Conversion Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-3xl font-bold text-blue-600">
                  {formatPercent(data.kpis.attendanceRate)}
                </p>
                <p className="text-sm text-slate-600 mt-1">Show-up Rate</p>
                <p className="text-xs text-slate-500 mt-2">
                  {data.kpis.totalBooked - data.kpis.totalAttended} no-shows/cancellations
                </p>
              </div>
              <div className="text-center p-4 bg-violet-50 rounded-lg">
                <p className="text-3xl font-bold text-violet-600">
                  {formatPercent(data.kpis.closeRate)}
                </p>
                <p className="text-sm text-slate-600 mt-1">Close Rate</p>
                <p className="text-xs text-slate-500 mt-2">
                  {data.kpis.totalClosed} of {data.kpis.totalAttended} attended
                </p>
              </div>
              <div className="text-center p-4 bg-emerald-50 rounded-lg">
                <p className="text-3xl font-bold text-emerald-600">
                  {formatPercent(data.kpis.conversionRate)}
                </p>
                <p className="text-sm text-slate-600 mt-1">Overall Conversion</p>
                <p className="text-xs text-slate-500 mt-2">
                  {data.kpis.totalClosed} of {data.kpis.totalBooked} booked
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Drawer for client list and details */}
      <Drawer open={isDrawerOpen} onOpenChange={(open) => !open && closeDrawer()}>
        <DrawerContent>
          <VisuallyHidden.Root>
            <DrawerTitle>
              {selectedClient ? selectedClient.name : filter?.label || 'Client Details'}
            </DrawerTitle>
          </VisuallyHidden.Root>
          {selectedClient ? (
            <ClientDrawer client={selectedClient} />
          ) : (
            <ClientListPanel clients={data.clients} />
          )}
        </DrawerContent>
      </Drawer>
    </>
  )
}

export default function PipelinePage() {
  const { data, isLoading, isError, refresh, dataSource } = useDashboardData()

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <Header title="Pipeline" description="Conversion funnel analysis" />
        <div className="flex-1 p-6">
          <DashboardSkeleton />
        </div>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col h-full">
        <Header title="Pipeline" />
        <div className="flex-1 p-6 flex items-center justify-center">
          <p className="text-slate-500">Failed to load data. Please try again.</p>
        </div>
      </div>
    )
  }

  return (
    <PipelineProvider>
      <div className="flex flex-col h-full">
        <Header
          title="Pipeline"
          description="Track clients through your conversion funnel"
          onRefresh={refresh}
          isLoading={isLoading}
          lastUpdated={data.lastUpdated}
          dataSource={dataSource}
        />
        <PipelineContent data={data} />
      </div>
    </PipelineProvider>
  )
}
