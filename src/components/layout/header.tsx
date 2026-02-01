'use client'

import { RefreshCw, Database, Cloud, FileSpreadsheet } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
      {label}
    </div>
  )
}

export function Header({ title, description, onRefresh, isLoading, lastUpdated, dataSource, filterElement }: HeaderProps) {
  return (
    <div className="flex items-center justify-between border-b bg-white px-6 py-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        {description && (
          <p className="text-sm text-slate-500">{description}</p>
        )}
      </div>
      <div className="flex items-center gap-4">
        {filterElement}
        {dataSource && <DataSourceBadge source={dataSource} />}
        {lastUpdated && (
          <span className="text-xs text-slate-400">
            Last updated: {new Date(lastUpdated).toLocaleTimeString()}
          </span>
        )}
        {onRefresh && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={cn('h-4 w-4 mr-2', isLoading && 'animate-spin')} />
            Refresh
          </Button>
        )}
      </div>
    </div>
  )
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}
