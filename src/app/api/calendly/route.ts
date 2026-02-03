import { NextResponse } from 'next/server'
import { fetchCalendlyData, hasCalendlyCredentials } from '@/lib/calendly'
import type { CalendlyApiResponse } from '@/types/calendly'

// Cache for 5 minutes (Calendly has rate limits)
export const revalidate = 300

export async function GET() {
  // Check if Calendly is configured
  if (!hasCalendlyCredentials()) {
    return NextResponse.json({
      bookings: [],
      analytics: {
        totalBookings: 0,
        avgBookingsPerDay: 0,
        noShowRate: 0,
        cancellationRate: 0,
        noShowCount: 0,
        cancellationCount: 0,
        attendedCount: 0,
        scheduledCount: 0,
        timeSlotStats: [],
        dailyTrends: [],
        topTimeSlots: [],
      },
      lastFetched: new Date().toISOString(),
      isConfigured: false,
    } satisfies CalendlyApiResponse, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    })
  }

  try {
    console.log('Fetching Calendly data...')
    const { bookings, analytics } = await fetchCalendlyData()
    console.log(`Successfully fetched ${bookings.length} bookings from Calendly`)

    return NextResponse.json({
      bookings,
      analytics,
      lastFetched: new Date().toISOString(),
      isConfigured: true,
    } satisfies CalendlyApiResponse, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    })
  } catch (error) {
    console.error('Error fetching Calendly data:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    return NextResponse.json({
      error: 'Failed to fetch Calendly data',
      details: errorMessage,
      lastFetched: new Date().toISOString(),
      isConfigured: true,
    }, {
      status: 500,
      headers: {
        'Cache-Control': 'no-store',
      },
    })
  }
}
