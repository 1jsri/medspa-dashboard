'use client'

import { Phone, Flame, DollarSign, Clock, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ActionItems as ActionItemsType } from '@/types/dashboard'

interface ActionItemsProps {
  actionItems: ActionItemsType
  onNoShowsClick: () => void
  onWarmLeadsClick: () => void
  onUnpaidClick: () => void
  onStaleClick: () => void
}

interface ActionCardProps {
  icon: React.ReactNode
  count: number
  label: string
  sublabel: string
  onClick: () => void
  colorClass: string
  bgClass: string
}

function ActionCard({ icon, count, label, sublabel, onClick, colorClass, bgClass }: ActionCardProps) {
  return (
    <button
      onClick={onClick}
      className={`${bgClass} p-4 rounded-lg text-left hover:shadow-md transition-all group w-full`}
    >
      <div className="flex items-start justify-between">
        <div className={`${colorClass}`}>
          {icon}
        </div>
        <ChevronRight className={`h-4 w-4 ${colorClass} opacity-0 group-hover:opacity-100 transition-opacity`} />
      </div>
      <div className={`text-3xl font-bold ${colorClass} mt-2`}>
        {count}
      </div>
      <div className="mt-1">
        <p className={`font-medium ${colorClass}`}>{label}</p>
        <p className="text-sm text-slate-500">{sublabel}</p>
      </div>
    </button>
  )
}

export function ActionItems({
  actionItems,
  onNoShowsClick,
  onWarmLeadsClick,
  onUnpaidClick,
  onStaleClick,
}: ActionItemsProps) {
  const hasAnyItems =
    actionItems.noShowsToRescue.length > 0 ||
    actionItems.warmLeadsToClose.length > 0 ||
    actionItems.unpaidBalances.length > 0 ||
    actionItems.staleLeads.length > 0

  if (!hasAnyItems) {
    return null
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <span className="text-xl">🎯</span>
          Action Items
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <ActionCard
            icon={<Phone className="h-5 w-5" />}
            count={actionItems.noShowsToRescue.length}
            label="No-Shows"
            sublabel="to Rescue"
            onClick={onNoShowsClick}
            colorClass="text-red-600"
            bgClass="bg-red-50 hover:bg-red-100"
          />
          <ActionCard
            icon={<Flame className="h-5 w-5" />}
            count={actionItems.warmLeadsToClose.length}
            label="Warm Leads"
            sublabel="to Close"
            onClick={onWarmLeadsClick}
            colorClass="text-orange-600"
            bgClass="bg-orange-50 hover:bg-orange-100"
          />
          <ActionCard
            icon={<DollarSign className="h-5 w-5" />}
            count={actionItems.unpaidBalances.length}
            label="Unpaid"
            sublabel="Balances"
            onClick={onUnpaidClick}
            colorClass="text-amber-600"
            bgClass="bg-amber-50 hover:bg-amber-100"
          />
          <ActionCard
            icon={<Clock className="h-5 w-5" />}
            count={actionItems.staleLeads.length}
            label="Stale"
            sublabel="7+ Days No Progress"
            onClick={onStaleClick}
            colorClass="text-slate-600"
            bgClass="bg-slate-100 hover:bg-slate-200"
          />
        </div>
      </CardContent>
    </Card>
  )
}
