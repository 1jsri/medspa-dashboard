// Calendly API types and dashboard types

// Raw Calendly API response types
export interface CalendlyEventResource {
  uri: string
  name: string
  status: 'active' | 'canceled'
  start_time: string
  end_time: string
  event_type: string
  location: {
    type: string
    location?: string
  } | null
  invitees_counter: {
    total: number
    active: number
    limit: number
  }
  created_at: string
  updated_at: string
  event_memberships: Array<{
    user: string
  }>
  calendar_event?: {
    kind: string
    external_id: string
  } | null
}

export interface CalendlyEventsResponse {
  collection: CalendlyEventResource[]
  pagination: {
    count: number
    next_page: string | null
    previous_page: string | null
    next_page_token: string | null
  }
}

export interface CalendlyInvitee {
  uri: string
  email: string
  name: string
  status: 'active' | 'canceled'
  reschedule_url: string
  cancel_url: string
  created_at: string
  updated_at: string
  no_show: {
    uri: string
    created_at: string
  } | null
  timezone: string
  questions_and_answers: Array<{
    question: string
    answer: string
    position: number
  }>
  tracking?: {
    utm_source?: string
    utm_medium?: string
    utm_campaign?: string
  } | null
  payment?: {
    external_id: string
    provider: string
    amount: number
    currency: string
    terms: string
    successful: boolean
  } | null
}

export interface CalendlyInviteesResponse {
  collection: CalendlyInvitee[]
  pagination: {
    count: number
    next_page: string | null
    previous_page: string | null
    next_page_token: string | null
  }
}

// Transformed booking type for dashboard use
export interface CalendlyBooking {
  id: string
  eventName: string
  email: string
  name: string
  scheduledAt: string  // ISO date string
  endTime: string      // ISO date string
  status: 'scheduled' | 'attended' | 'no_show' | 'canceled' | 'rescheduled'
  timezone: string
  createdAt: string
  noShowMarkedAt: string | null
  canceledAt: string | null
  phone?: string
  notes?: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
}

// Status mapping for dashboard compatibility
export type CalendlyCallStatus = 'Scheduled' | 'Attended' | 'No Show' | 'Cancelled' | 'Rescheduled'

// Analytics types
export interface TimeSlotStats {
  dayOfWeek: number  // 0 = Sunday, 6 = Saturday
  hour: number       // 0-23
  count: number
}

export interface DailyBookingTrend {
  date: string       // YYYY-MM-DD
  count: number
}

export interface CalendlyAnalytics {
  totalBookings: number
  avgBookingsPerDay: number
  noShowRate: number
  cancellationRate: number
  noShowCount: number
  cancellationCount: number
  attendedCount: number
  scheduledCount: number
  timeSlotStats: TimeSlotStats[]
  dailyTrends: DailyBookingTrend[]
  topTimeSlots: Array<{
    label: string
    count: number
  }>
}

// API response type
export interface CalendlyApiResponse {
  bookings: CalendlyBooking[]
  analytics: CalendlyAnalytics
  lastFetched: string
  isConfigured: boolean
}
