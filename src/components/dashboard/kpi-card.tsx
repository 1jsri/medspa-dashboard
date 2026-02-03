import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'
import type { ComparisonResult } from '@/types/dashboard'

interface KPICardProps {
  title: string
  value: string | number
  description?: string
  icon?: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
  comparison?: ComparisonResult | null
  quota?: {
    target: number
    current: number
    label?: string
  } | null
  className?: string
}

export function KPICard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  comparison,
  quota,
  className
}: KPICardProps) {
  // Format comparison display
  const formatComparison = (comp: ComparisonResult) => {
    const arrow = comp.isPositive ? '↑' : '↓'
    const valueStr = comp.type === 'points'
      ? `${comp.value.toFixed(1)} pts`
      : `${comp.value.toFixed(1)}%`
    return `${arrow} ${valueStr} ${comp.label}`
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-600">{title}</CardTitle>
        {Icon && <Icon className="h-4 w-4 text-slate-400" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-slate-900">{value}</div>
        {description && (
          <p className="text-xs text-slate-500 mt-1">{description}</p>
        )}
        {/* Prefer comparison over trend when both are present */}
        {comparison ? (
          <p className={cn(
            'text-xs mt-1 font-medium',
            comparison.isPositive ? 'text-emerald-600' : 'text-red-600'
          )}>
            {formatComparison(comparison)}
          </p>
        ) : trend ? (
          <p className={cn(
            'text-xs mt-1 font-medium',
            trend.isPositive ? 'text-emerald-600' : 'text-red-600'
          )}>
            {trend.isPositive ? '+' : ''}{trend.value}% from last period
          </p>
        ) : null}
        {/* Future: quota progress bar */}
        {quota && quota.target > 0 && (
          <div className="mt-2">
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>{quota.label || 'Progress'}</span>
              <span>{Math.round((quota.current / quota.target) * 100)}% to quota</span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, (quota.current / quota.target) * 100)}%` }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
