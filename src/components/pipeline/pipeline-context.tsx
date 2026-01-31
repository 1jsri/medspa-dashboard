'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'
import type { Client, JourneyStage } from '@/types/dashboard'

export type FilterType =
  | 'stage'
  | 'callStatus'
  | 'dropOff'
  | 'actionNoShows'
  | 'actionWarmLeads'
  | 'actionUnpaid'
  | 'actionStale'
  | null

export interface PipelineFilter {
  type: FilterType
  value: string | null
  label: string
}

interface PipelineContextType {
  filter: PipelineFilter | null
  setFilter: (filter: PipelineFilter | null) => void
  selectedClient: Client | null
  setSelectedClient: (client: Client | null) => void
  isDrawerOpen: boolean
  openDrawer: (filter: PipelineFilter) => void
  closeDrawer: () => void
  openClientDetail: (client: Client) => void
  goBackToList: () => void
  filterClients: (clients: Client[]) => Client[]
}

const PipelineContext = createContext<PipelineContextType | undefined>(undefined)

export function PipelineProvider({ children }: { children: React.ReactNode }) {
  const [filter, setFilter] = useState<PipelineFilter | null>(null)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const openDrawer = useCallback((newFilter: PipelineFilter) => {
    setFilter(newFilter)
    setSelectedClient(null)
    setIsDrawerOpen(true)
  }, [])

  const closeDrawer = useCallback(() => {
    setIsDrawerOpen(false)
    setFilter(null)
    setSelectedClient(null)
  }, [])

  const openClientDetail = useCallback((client: Client) => {
    setSelectedClient(client)
  }, [])

  const goBackToList = useCallback(() => {
    setSelectedClient(null)
  }, [])

  const filterClients = useCallback((clients: Client[]): Client[] => {
    if (!filter) return clients

    switch (filter.type) {
      case 'stage':
        return clients.filter(c => c.journeyStage === filter.value)

      case 'callStatus':
        return clients.filter(c => c.callStatus === filter.value)

      case 'dropOff':
        // Filter by clients who dropped off at a specific stage
        if (filter.value === 'attended') {
          // Dropped between Booked and Attended (didn't attend)
          return clients.filter(c =>
            c.callStatus !== 'Attended' &&
            c.journeyStage === 'booked'
          )
        } else if (filter.value === 'closed') {
          // Dropped between Attended and Closed (attended but didn't close)
          return clients.filter(c =>
            c.callStatus === 'Attended' &&
            c.closedStatus !== 'Closed' &&
            c.journeyStage === 'attended'
          )
        } else if (filter.value === 'paid') {
          // Dropped between Closed and Paid (closed but hasn't paid fully)
          return clients.filter(c =>
            c.closedStatus === 'Closed' &&
            c.journeyStage === 'closed'
          )
        }
        return clients

      case 'actionNoShows':
        return clients.filter(c =>
          c.callStatus === 'No Show' && c.closedStatus !== 'Closed'
        )

      case 'actionWarmLeads':
        return clients.filter(c =>
          c.journeyStage === 'attended' && c.closedStatus !== 'Closed'
        )

      case 'actionUnpaid':
        return clients.filter(c => c.balance > 0)

      case 'actionStale':
        // This is handled in the component since it needs date comparison
        // but we can approximate by checking booked stage
        return clients.filter(c => c.journeyStage === 'booked')

      default:
        return clients
    }
  }, [filter])

  return (
    <PipelineContext.Provider
      value={{
        filter,
        setFilter,
        selectedClient,
        setSelectedClient,
        isDrawerOpen,
        openDrawer,
        closeDrawer,
        openClientDetail,
        goBackToList,
        filterClients,
      }}
    >
      {children}
    </PipelineContext.Provider>
  )
}

export function usePipelineContext() {
  const context = useContext(PipelineContext)
  if (context === undefined) {
    throw new Error('usePipelineContext must be used within a PipelineProvider')
  }
  return context
}
