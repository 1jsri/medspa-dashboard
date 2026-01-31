'use client'

import { ArrowLeft, User, Phone, Mail, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { usePipelineContext } from './pipeline-context'
import type { Client } from '@/types/dashboard'
import { formatCurrency } from '@/lib/utils'

interface ClientListPanelProps {
  clients: Client[]
}

function getJourneyBadgeVariant(stage: string): 'default' | 'secondary' | 'success' | 'destructive' | 'warning' {
  switch (stage) {
    case 'paid':
      return 'success'
    case 'closed':
      return 'default'
    case 'attended':
      return 'secondary'
    case 'booked':
      return 'warning'
    default:
      return 'secondary'
  }
}

function getCallStatusBadgeVariant(status: string | null): 'default' | 'secondary' | 'success' | 'destructive' | 'warning' {
  switch (status) {
    case 'Attended':
      return 'success'
    case 'No Show':
    case 'Cancelled':
      return 'destructive'
    case 'Rescheduled':
      return 'warning'
    default:
      return 'secondary'
  }
}

export function ClientListPanel({ clients }: ClientListPanelProps) {
  const { filter, closeDrawer, openClientDetail, filterClients } = usePipelineContext()

  const filteredClients = filterClients(clients)

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 pb-4 border-b">
        <Button
          variant="ghost"
          size="sm"
          onClick={closeDrawer}
          className="p-1 h-auto"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-lg font-semibold">{filter?.label || 'Clients'}</h2>
          <p className="text-sm text-slate-500">
            {filteredClients.length} client{filteredClients.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto mt-4 -mx-6 px-6">
        {filteredClients.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            No clients found
          </div>
        ) : (
          <div className="space-y-2">
            {filteredClients.map((client, index) => (
              <button
                key={`${client.email || client.name}-${index}`}
                onClick={() => openClientDetail(client)}
                className="w-full text-left p-4 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <User className="h-4 w-4 text-slate-400 flex-shrink-0" />
                      <span className="font-medium text-slate-900 truncate">
                        {client.name || 'Unknown'}
                      </span>
                    </div>

                    {client.email && (
                      <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                        <Mail className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{client.email}</span>
                      </div>
                    )}

                    {client.phone && (
                      <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                        <Phone className="h-3 w-3 flex-shrink-0" />
                        <span>{client.phone}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={getJourneyBadgeVariant(client.journeyStage)}>
                        {client.journeyStage.charAt(0).toUpperCase() + client.journeyStage.slice(1)}
                      </Badge>
                      {client.callStatus && (
                        <Badge variant={getCallStatusBadgeVariant(client.callStatus)}>
                          {client.callStatus}
                        </Badge>
                      )}
                      {client.vibe && (
                        <Badge variant="secondary" className="text-xs">
                          {client.vibe}
                        </Badge>
                      )}
                    </div>

                    {(client.actualPrice > 0 || client.expectedPrice > 0) && (
                      <div className="mt-2 text-sm">
                        <span className="font-medium text-slate-700">
                          {formatCurrency(client.actualPrice || client.expectedPrice, client.currency)}
                        </span>
                        {client.balance > 0 && (
                          <span className="text-amber-600 ml-2">
                            ({formatCurrency(client.balance, client.currency)} remaining)
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-slate-500 flex-shrink-0 mt-1" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
