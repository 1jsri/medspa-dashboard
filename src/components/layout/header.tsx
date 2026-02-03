'use client'

import { RefreshCw, Database, Cloud, FileSpreadsheet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { DataSource } from '@/hooks/use-dashboard-data'

interface HeaderProps {
  title: string
  description?: string
  onRefresh?: () => void
  isLoading?: boolean
  lastUpdated?: string
  dataSource?: DataSource
  filterElement?: React.ReactNode
}

function DataSourceBadge({ source }: { source: DataSource }) {
  const config = {
    'google-sheets': {
      label: 'Live Data',
      icon: Cloud,
      className: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    },
    'excel': {
      label: 'Excel File',
      icon: FileSpreadsheet,
      className: 'bg-blue-100 text-blue-700 border-blue-200',
    },
    'demo': {
      label: 'Demo Data',
      icon: Database,
      className: 'bg-amber-100 text-amber-700 border-amber-200',
    },
  }

  const { label, icon: Icon, className } = config[source]

  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${className}`}>
      <Icon className="h-3 w-3" />
      <span className="hidden sm:inline">{label}</span>
    </div>
  )
}

export function Header({ title, description, onRefresh, isLoading, lastUpdated, dataSource, filterElement }: HeaderProps) {
  return (
    <div className="flex flex-col gap-3 border-b bg-white px-4 py-3 md:flex-row md:items-center md:justify-between md:px-6 md:py-4">
      {/* Title Section */}
      <div className="min-w-0 flex-1">
        <h1 className="text-lg font-bold text-slate-900 md:text-2xl truncate">{title}</h1>
        {description && (
          <p className="text-sm text-slate-500 hidden sm:block">{description}</p>
        )}
      </div>

      {/* Actions Section */}
      <div className="flex flex-wrap items-center gap-2 md:gap-4">
        {filterElement}
        {dataSource && <DataSourceBadge source={dataSource} />}
        {lastUpdated && (
          <span className="hidden lg:inline text-xs text-slate-400">
            Last updated: {new Date(lastUpdated).toLocaleTimeString()}
          </span>
        )}
        {onRefresh && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
            className="px-2 md:px-4"
          >
            <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
            <span className="hidden md:inline ml-2">Refresh</span>
          </Button>
        )}
      </div>
    </div>
  )
}
