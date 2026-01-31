'use client'

import { ArrowLeft, User, Mail, Phone, Calendar, DollarSign, Users, FileText, MapPin, Thermometer } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { usePipelineContext } from './pipeline-context'
import type { Client } from '@/types/dashboard'
import { formatCurrency, formatDate } from '@/lib/utils'

interface ClientDrawerProps {
  client: Client
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

function getVibeBadgeColor(vibe: string | null): string {
  switch (vibe) {
    case 'Hot':
      return 'bg-red-100 text-red-700 border-red-200'
    case 'Warm':
      return 'bg-orange-100 text-orange-700 border-orange-200'
    case 'Cold':
      return 'bg-blue-100 text-blue-700 border-blue-200'
    case 'On Fence':
      return 'bg-yellow-100 text-yellow-700 border-yellow-200'
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200'
  }
}

interface TimelineItemProps {
  label: string
  date: string | null
  details?: string
  isCompleted: boolean
  isActive: boolean
}

function TimelineItem({ label, date, details, isCompleted, isActive }: TimelineItemProps) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div
          className={`w-3 h-3 rounded-full border-2 ${
            isCompleted
              ? 'bg-emerald-500 border-emerald-500'
              : isActive
              ? 'bg-blue-500 border-blue-500'
              : 'bg-white border-slate-300'
          }`}
        />
        <div className="w-0.5 flex-1 bg-slate-200 mt-1" />
      </div>
      <div className="pb-4">
        <p className={`font-medium ${isCompleted || isActive ? 'text-slate-900' : 'text-slate-400'}`}>
          {label}
        </p>
        {date && (
          <p className="text-sm text-slate-500">{formatDate(date)}</p>
        )}
        {details && (
          <p className="text-sm text-slate-600 mt-0.5">{details}</p>
        )}
      </div>
    </div>
  )
}

export function ClientDrawer({ client }: ClientDrawerProps) {
  const { goBackToList } = usePipelineContext()

  const journeyStages = ['booked', 'attended', 'closed', 'paid']
  const currentStageIndex = journeyStages.indexOf(client.journeyStage)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b">
        <Button
          variant="ghost"
          size="sm"
          onClick={goBackToList}
          className="p-1 h-auto"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to List
        </Button>
        <Badge variant={getJourneyBadgeVariant(client.journeyStage)}>
          {client.journeyStage.charAt(0).toUpperCase() + client.journeyStage.slice(1)}
        </Badge>
      </div>

      {/* Client Info */}
      <div className="py-4 border-b">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
            <User className="h-6 w-6 text-slate-500" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900">{client.name || 'Unknown'}</h2>
            {(client.city || client.state) && (
              <div className="flex items-center gap-1 text-sm text-slate-500">
                <MapPin className="h-3 w-3" />
                {[client.city, client.state].filter(Boolean).join(', ')}
              </div>
            )}
          </div>
        </div>
        <div className="space-y-1">
          {client.email && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Mail className="h-4 w-4 text-slate-400" />
              <a href={`mailto:${client.email}`} className="hover:text-blue-600">
                {client.email}
              </a>
            </div>
          )}
          {client.phone && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Phone className="h-4 w-4 text-slate-400" />
              <a href={`tel:${client.phone}`} className="hover:text-blue-600">
                {client.phone}
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto py-4 space-y-6">
        {/* Journey Timeline */}
        <div>
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Journey Timeline
          </h3>
          <div className="pl-1">
            <TimelineItem
              label="Booked"
              date={client.bookingDate}
              isCompleted={currentStageIndex >= 0}
              isActive={currentStageIndex === 0}
            />
            <TimelineItem
              label="Call"
              date={client.callDate}
              details={client.callStatus ? `(${client.callStatus})` : undefined}
              isCompleted={currentStageIndex >= 1}
              isActive={currentStageIndex === 1}
            />
            <TimelineItem
              label="Closed"
              date={client.purchaseDate || (client.closedStatus === 'Closed' ? client.callDate : null)}
              isCompleted={currentStageIndex >= 2}
              isActive={currentStageIndex === 2}
            />
            <div className="flex gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={`w-3 h-3 rounded-full border-2 ${
                    currentStageIndex >= 3
                      ? 'bg-emerald-500 border-emerald-500'
                      : 'bg-white border-slate-300'
                  }`}
                />
              </div>
              <div>
                <p className={`font-medium ${currentStageIndex >= 3 ? 'text-slate-900' : 'text-slate-400'}`}>
                  Paid
                </p>
                {client.cashCollected > 0 && (
                  <p className="text-sm text-emerald-600">
                    {formatCurrency(client.cashCollected, client.currency)} collected
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Deal Details */}
        <div>
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Deal Details
          </h3>
          <div className="bg-slate-50 rounded-lg p-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-600">Program</span>
              <span className="font-medium text-slate-900">
                {client.program || client.expectedPackage || '-'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Price</span>
              <span className="font-medium text-slate-900">
                {formatCurrency(client.actualPrice || client.expectedPrice, client.currency)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Collected</span>
              <span className="font-medium text-emerald-600">
                {formatCurrency(client.cashCollected, client.currency)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Balance</span>
              <span className={`font-medium ${client.balance > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
                {formatCurrency(client.balance, client.currency)}
              </span>
            </div>
            {client.paymentMethod && (
              <div className="flex justify-between">
                <span className="text-slate-600">Payment</span>
                <span className="font-medium text-slate-900">{client.paymentMethod}</span>
              </div>
            )}
            {client.paymentStatus && (
              <div className="flex justify-between">
                <span className="text-slate-600">Status</span>
                <span className="font-medium text-slate-900">{client.paymentStatus}</span>
              </div>
            )}
            {client.daysToClose !== null && (
              <div className="flex justify-between">
                <span className="text-slate-600">Days to Close</span>
                <span className="font-medium text-slate-900">{client.daysToClose}</span>
              </div>
            )}
          </div>
        </div>

        {/* Team */}
        {(client.closer || client.setter) && (
          <div>
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Team
            </h3>
            <div className="flex items-center gap-4">
              <Users className="h-5 w-5 text-slate-400" />
              <div className="flex flex-wrap gap-3">
                {client.closer && (
                  <div>
                    <span className="text-xs text-slate-500 uppercase">Closer</span>
                    <p className="font-medium text-slate-900">{client.closer}</p>
                  </div>
                )}
                {client.setter && (
                  <div>
                    <span className="text-xs text-slate-500 uppercase">Setter</span>
                    <p className="font-medium text-slate-900">{client.setter}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Vibe & Objection */}
        {(client.vibe || client.objection) && (
          <div>
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Lead Status
            </h3>
            <div className="flex flex-wrap gap-2">
              {client.vibe && (
                <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${getVibeBadgeColor(client.vibe)}`}>
                  <Thermometer className="h-3.5 w-3.5" />
                  <span className="text-sm font-medium">{client.vibe}</span>
                </div>
              )}
              {client.objection && (
                <Badge variant="secondary" className="px-3 py-1.5">
                  Objection: {client.objection}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Notes */}
        {(client.notes || client.lastContactNotes) && (
          <div>
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Notes
            </h3>
            <div className="bg-slate-50 rounded-lg p-4 space-y-3">
              {client.notes && (
                <div>
                  <p className="text-sm text-slate-600">{client.notes}</p>
                </div>
              )}
              {client.lastContactNotes && (
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-xs text-slate-500">
                      Last Contact: {client.lastContact ? formatDate(client.lastContact) : 'Unknown'}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">{client.lastContactNotes}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
