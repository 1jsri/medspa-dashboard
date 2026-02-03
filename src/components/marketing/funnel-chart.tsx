'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn, formatPercent } from '@/lib/utils'
import type { MarketingFunnelStage } from '@/types/marketing'

interface MarketingFunnelChartProps {
  stages: MarketingFunnelStage[]
  className?: string
}

const stageColors = [
  'bg-slate-500',
  'bg-blue-500',
  'bg-indigo-500',
  'bg-violet-500',
  'bg-purple-500',
  'bg-emerald-500',
]

export function MarketingFunnelChart({ stages, className }: MarketingFunnelChartProps) {
  const maxCount = stages[0]?.count || 1

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">Marketing Funnel</CardTitle>
        <p className="text-sm text-slate-500">From ad click to paid customer</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {stages.map((stage, index) => {
            const widthPercent = (stage.count / maxCount) * 100
            const prevStage = stages[index - 1]
            const conversionFromPrev = prevStage
              ? ((stage.count / prevStage.count) * 100).toFixed(1)
              : null

            return (
              <div key={stage.stage} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-700">{stage.stage}</span>
                    {conversionFromPrev && (
                      <span className="text-xs text-slate-400">
                        ({conversionFromPrev}% of prev)
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{stage.count.toLocaleString()}</span>
                  </div>
                </div>
                <div className="h-8 w-full rounded-lg bg-slate-100 overflow-hidden">
                  <div
                    className={cn(
                      'h-full transition-all duration-500 rounded-lg flex items-center justify-end pr-2',
                      stageColors[index % stageColors.length]
                    )}
                    style={{ width: `${Math.max(widthPercent, 3)}%` }}
                  >
                    {widthPercent > 15 && (
                      <span className="text-xs font-medium text-white">
                        {stage.count.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
                {stage.dropOff > 0 && (
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <span className="text-red-400">↓</span>
                    <span>{stage.dropOff.toLocaleString()} dropped off</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
