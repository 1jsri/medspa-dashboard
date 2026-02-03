'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn, formatCurrency, formatPercent } from '@/lib/utils'
import { Facebook, Instagram } from 'lucide-react'
import type { PlatformMetrics } from '@/types/marketing'

interface PlatformCardProps {
  metrics: PlatformMetrics
  className?: string
}

const platformConfig = {
  Facebook: {
    icon: Facebook,
    bgGradient: 'bg-gradient-to-br from-blue-50 to-blue-100',
    iconColor: 'text-[#1877F2]',
    borderColor: 'border-blue-200',
  },
  Instagram: {
    icon: Instagram,
    bgGradient: 'bg-gradient-to-br from-pink-50 via-purple-50 to-orange-50',
    iconColor: 'text-[#E4405F]',
    borderColor: 'border-pink-200',
  },
}

export function PlatformCard({ metrics, className }: PlatformCardProps) {
  const config = platformConfig[metrics.platform as keyof typeof platformConfig] || platformConfig.Facebook
  const Icon = config.icon

  return (
    <Card className={cn(config.bgGradient, config.borderColor, 'border', className)}>
      <CardHeader className="flex flex-row items-center gap-3 pb-2">
        <div className={cn('p-2 rounded-lg bg-white shadow-sm')}>
          <Icon className={cn('h-6 w-6', config.iconColor)} />
        </div>
        <CardTitle className="text-lg font-semibold text-slate-900">
          {metrics.platform}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-slate-500">Leads</p>
            <p className="text-2xl font-bold text-slate-900">{metrics.leads}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Spend</p>
            <p className="text-2xl font-bold text-slate-900">{formatCurrency(metrics.spend)}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">CPL</p>
            <p className="text-xl font-semibold text-slate-700">{formatCurrency(metrics.cpl)}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">ROI</p>
            <p className={cn(
              'text-xl font-semibold',
              metrics.roi >= 10 ? 'text-emerald-600' : metrics.roi >= 5 ? 'text-amber-600' : 'text-red-600'
            )}>
              {metrics.roi.toFixed(1)}x
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
