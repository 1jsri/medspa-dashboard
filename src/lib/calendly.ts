import type {
  CalendlyEventsResponse,
  CalendlyEventResource,
  CalendlyInviteesResponse,
  CalendlyInvitee,
  CalendlyBooking,
  CalendlyAnalytics,
  TimeSlotStats,
  DailyBookingTrend,
} from '@/types/calendly'
import { format, parseISO, subDays, differenceInDays, getDay, getHours } from 'date-fns'

const CALENDLY_API_BASE = 'https://api.calendly.com'

/**
 * Check if Calendly credentials are configured
 */
export function hasCalendlyCredentials(): boolean {
  return !!(process.env.CALENDLY_API_KEY && process.env.CALENDLY_USER_URI)
}

/**
 * Get Calendly API headers
 */
function getHeaders(): HeadersInit {
  return {
    'Authorization': `Bearer ${process.env.CALENDLY_API_KEY}`,
    'Content-Type': 'application/json',
  }
}

/**
 * Fetch scheduled events from Calendly API with pagination
 * @param minStartTime - Minimum start time for events (default: 90 days ago)
 * @param maxStartTime - Maximum start time for events (default: 30 days in future)
 */
export async function fetchScheduledEvents(
  minStartTime?: Date,
  maxStartTime?: Date
): Promise<CalendlyEventResource[]> {
  const userUri = process.env.CALENDLY_USER_URI
  if (!userUri) {
    throw new Error('CALENDLY_USER_URI is not configured')
  }

  const allEvents: CalendlyEventResource[] = []
  let nextPageToken: string | null = null

  // Default date range: 90 days ago to 30 days in future
  const minTime = minStartTime || subDays(new Date(), 90)
  const maxTime = maxStartTime || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

  do {
    const params = new URLSearchParams({
      user: userUri,
      min_start_time: minTime.toISOString(),
      max_start_time: maxTime.toISOString(),
      count: '100',
      status: 'active',
    })

    if (nextPageToken) {
      params.set('page_token', nextPageToken)
    }

    const response = await fetch(`${CALENDLY_API_BASE}/scheduled_events?${params}`, {
      headers: getHeaders(),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Calendly API error (${response.status}): ${errorText}`)
    }

    const data: CalendlyEventsResponse = await response.json()
    allEvents.push(...data.collection)
    nextPageToken = data.pagination.next_page_token
  } while (nextPageToken)

  // Also fetch canceled events
  nextPageToken = null
  do {
    const params = new URLSearchParams({
      user: userUri,
      min_start_time: minTime.toISOString(),
      max_start_time: maxTime.toISOString(),
      count: '100',
      status: 'canceled',
    })

    if (nextPageToken) {
      params.set('page_token', nextPageToken)
    }

    const response = await fetch(`${CALENDLY_API_BASE}/scheduled_events?${params}`, {
      headers: getHeaders(),
    })

    if (!response.ok) {
      // Don't fail on canceled events fetch error
      console.warn('Failed to fetch canceled events:', response.statusText)
      break
    }

    const data: CalendlyEventsResponse = await response.json()
    allEvents.push(...data.collection)
    nextPageToken = data.pagination.next_page_token
  } while (nextPageToken)

  return allEvents
}

/**
 * Fetch invitee details for a specific event
 */
export async function fetchInviteeForEvent(eventUri: string): Promise<CalendlyInvitee | null> {
  const response = await fetch(`${eventUri}/invitees`, {
    headers: getHeaders(),
  })

  if (!response.ok) {
    console.warn(`Failed to fetch invitee for event ${eventUri}: ${response.statusText}`)
    return null
  }

  const data: CalendlyInviteesResponse = await response.json()
  // Return the first invitee (most events have one invitee)
  return data.collection[0] || null
}

/**
 * Transform Calendly API response to dashboard booking format
 */
export function transformToBooking(
  event: CalendlyEventResource,
  invitee: CalendlyInvitee | null
): CalendlyBooking {
  const now = new Date()
  const eventStartTime = parseISO(event.start_time)
  const isPast = eventStartTime < now

  // Determine booking status
  let status: CalendlyBooking['status'] = 'scheduled'

  if (event.status === 'canceled') {
    status = 'canceled'
  } else if (invitee?.no_show) {
    status = 'no_show'
  } else if (isPast) {
    // If event is in the past and not marked as no-show, assume attended
    status = 'attended'
  }

  // Extract phone from questions if available
  const phoneAnswer = invitee?.questions_and_answers?.find(qa =>
    qa.question.toLowerCase().includes('phone') ||
    qa.question.toLowerCase().includes('number')
  )

  // Extract notes/comments from questions
  const notesAnswer = invitee?.questions_and_answers?.find(qa =>
    qa.question.toLowerCase().includes('note') ||
    qa.question.toLowerCase().includes('comment') ||
    qa.question.toLowerCase().includes('message')
  )

  return {
    id: event.uri.split('/').pop() || event.uri,
    eventName: event.name,
    email: invitee?.email || '',
    name: invitee?.name || '',
    scheduledAt: event.start_time,
    endTime: event.end_time,
    status,
    timezone: invitee?.timezone || 'UTC',
    createdAt: event.created_at,
    noShowMarkedAt: invitee?.no_show?.created_at || null,
    canceledAt: event.status === 'canceled' ? event.updated_at : null,
    phone: phoneAnswer?.answer,
    notes: notesAnswer?.answer,
    utmSource: invitee?.tracking?.utm_source,
    utmMedium: invitee?.tracking?.utm_medium,
    utmCampaign: invitee?.tracking?.utm_campaign,
  }
}

/**
 * Calculate analytics from bookings
 */
export function calculateAnalytics(bookings: CalendlyBooking[]): CalendlyAnalytics {
  const now = new Date()
  const ninetyDaysAgo = subDays(now, 90)

  // Filter to last 90 days for analytics
  const recentBookings = bookings.filter(b => {
    const scheduledDate = parseISO(b.scheduledAt)
    return scheduledDate >= ninetyDaysAgo
  })

  const totalBookings = recentBookings.length
  const noShowCount = recentBookings.filter(b => b.status === 'no_show').length
  const cancellationCount = recentBookings.filter(b => b.status === 'canceled').length
  const attendedCount = recentBookings.filter(b => b.status === 'attended').length
  const scheduledCount = recentBookings.filter(b => b.status === 'scheduled').length

  // Calculate days with bookings for average
  const uniqueDays = new Set(
    recentBookings.map(b => format(parseISO(b.scheduledAt), 'yyyy-MM-dd'))
  )
  const daysWithBookings = uniqueDays.size
  const avgBookingsPerDay = daysWithBookings > 0 ? totalBookings / daysWithBookings : 0

  // Calculate rates (exclude scheduled from denominator for no-show/cancel rates)
  const completedOrMissed = attendedCount + noShowCount + cancellationCount
  const noShowRate = completedOrMissed > 0 ? noShowCount / completedOrMissed : 0
  const cancellationRate = totalBookings > 0 ? cancellationCount / totalBookings : 0

  // Time slot statistics
  const timeSlotMap = new Map<string, TimeSlotStats>()
  for (const booking of recentBookings) {
    const scheduledDate = parseISO(booking.scheduledAt)
    const dayOfWeek = getDay(scheduledDate)
    const hour = getHours(scheduledDate)
    const key = `${dayOfWeek}-${hour}`

    if (!timeSlotMap.has(key)) {
      timeSlotMap.set(key, { dayOfWeek, hour, count: 0 })
    }
    timeSlotMap.get(key)!.count++
  }
  const timeSlotStats = Array.from(timeSlotMap.values())

  // Daily trends
  const dailyMap = new Map<string, number>()
  for (const booking of recentBookings) {
    const dateKey = format(parseISO(booking.scheduledAt), 'yyyy-MM-dd')
    dailyMap.set(dateKey, (dailyMap.get(dateKey) || 0) + 1)
  }
  const dailyTrends: DailyBookingTrend[] = Array.from(dailyMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date))

  // Top time slots
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const topTimeSlots = timeSlotStats
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .map(slot => ({
      label: `${dayNames[slot.dayOfWeek]} ${slot.hour}:00`,
      count: slot.count,
    }))

  return {
    totalBookings,
    avgBookingsPerDay: Math.round(avgBookingsPerDay * 10) / 10,
    noShowRate,
    cancellationRate,
    noShowCount,
    cancellationCount,
    attendedCount,
    scheduledCount,
    timeSlotStats,
    dailyTrends,
    topTimeSlots,
  }
}

/**
 * Main export: Fetch all Calendly data and compute analytics
 */
export async function fetchCalendlyData(): Promise<{
  bookings: CalendlyBooking[]
  analytics: CalendlyAnalytics
}> {
  if (!hasCalendlyCredentials()) {
    throw new Error('Calendly credentials not configured')
  }

  console.log('Fetching Calendly events...')
  const events = await fetchScheduledEvents()
  console.log(`Fetched ${events.length} events from Calendly`)

  // Fetch invitee details for each event (with rate limiting)
  const bookings: CalendlyBooking[] = []
  for (const event of events) {
    const invitee = await fetchInviteeForEvent(event.uri)
    const booking = transformToBooking(event, invitee)
    bookings.push(booking)

    // Small delay to respect rate limits (100 requests per minute)
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  // Sort by scheduled date (newest first)
  bookings.sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt))

  const analytics = calculateAnalytics(bookings)

  return { bookings, analytics }
}
