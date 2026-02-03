'use client'

import useSWR from 'swr'
import type { CalendlyApiResponse, CalendlyBooking, CalendlyAnalytics } from '@/types/calendly'

const fetcher = async (url: string): Promise<CalendlyApiResponse> => {
  const res = await fetch(url)
  if (!res.ok) {
    const error = new Error('Failed to fetch Calendly data')
    throw error
  }
  const data = await res.json()
  if (data.error) {
    const error = new Error(data.error)
    throw error
  }
  return data
}

interface UseCalendlyDataReturn {
  data: {
    bookings: CalendlyBooking[]
    analytics: CalendlyAnalytics
  } | null
  isLoading: boolean
  isError: Error | undefined
  refresh: () => void
  isConfigured: boolean
  lastFetched: string | null
}

export function useCalendlyData(): UseCalendlyDataReturn {
  const { data, error, isLoading, mutate } = useSWR<CalendlyApiResponse>(
    '/api/calendly',
    fetcher,
    {
      refreshInterval: 300000, // Refresh every 5 minutes
      revalidateOnFocus: true,
      dedupingInterval: 60000, // Dedupe requests within 1 minute
    }
  )

  return {
    data: data ? {
      bookings: data.bookings,
      analytics: data.analytics,
    } : null,
    isLoading,
    isError: error,
    refresh: () => mutate(),
    isConfigured: data?.isConfigured ?? false,
    lastFetched: data?.lastFetched ?? null,
  }
}
