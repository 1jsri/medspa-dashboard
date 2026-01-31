'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FunnelStage, JourneyStage } from '@/types/dashboard'
import { formatPercent } from '@/lib/utils'

interface ConversionFunnelProps {
  stages: FunnelStage[]
  className?: string
  onStageClick?: (stage: JourneyStage) => void
  onDropOffClick?: (stage: JourneyStage) => void
}

const stageColors = [
  'bg-blue-500 hover:bg-blue-600',
  'bg-indigo-500 hover:bg-indigo-600',
  'bg-violet-500 hover:bg-violet-600',
  'bg-emerald-500 hover:bg-emerald-600',
]

const stageMap: Record<string, JourneyStage> = {
  'Booked': 'booked',
  'Attended': 'attended',
  'Closed': 'closed',
  'Paid': 'paid',
}

const dropOffStageMap: Record<string, JourneyStage> = {
  'Attended': 'attended', // Dropped between Booked and Attended
  'Closed': 'closed',     // Dropped between Attended and Closed
  'Paid': 'paid',         // Dropped between Closed and Paid
}

export function ConversionFunnel({ stages, className, onStageClick, onDropOffClick }: ConversionFunnelProps) {
  const maxCount = stages[0]?.count || 1
  const isInteractive = !!onStageClick

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">Conversion Funnel</CardTitle>
        {isInteractive && (
          <p className="text-sm text-slate-500">Click any bar to view clients</p>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {stages.map((stage, index) => {
            const widthPercent = (stage.count / maxCount) * 100
            const journeyStage = stageMap[stage.stage]
            const dropOffStage = dropOffStageMap[stage.stage]

            return (
              <div key={stage.stage} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700">{stage.stage}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-900">{stage.count}</span>
                    <span className="text-slate-500">
                      ({formatPercent(stage.percentage)})
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => onStageClick?.(journeyStage)}
                  disabled={!isInteractive}
                  className={`h-8 w-full rounded-lg bg-slate-100 overflow-hidden ${
                    isInteractive ? 'cursor-pointer' : 'cursor-default'
                  }`}
                >
                  <div
                    className={`h-full ${stageColors[index]} transition-all duration-500 rounded-lg flex items-center justify-end pr-2 ${
                      isInteractive ? 'cursor-pointer' : ''
                    }`}
                    style={{ width: `${Math.max(widthPercent, 5)}%` }}
                  >
                    {widthPercent > 20 && (
                      <span className="text-xs font-medium text-white">
                        {stage.count}
                      </span>
                    )}
                  </div>
                </button>
                {stage.dropOff > 0 && (
                  <button
                    onClick={() => onDropOffClick?.(dropOffStage)}
                    disabled={!isInteractive}
                    className={`flex items-center gap-1 text-xs ${
                      isInteractive
                        ? 'text-red-500 hover:text-red-700 hover:underline cursor-pointer'
                        : 'text-slate-500 cursor-default'
                    }`}
                  >
                    <span className="text-red-500">↓</span>
                    <span>{stage.dropOff} dropped off</span>
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
