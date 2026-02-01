import {
  startOfWeek,
  startOfMonth,
  startOfQuarter,
  startOfYear,
  endOfDay,
  endOfWeek,
  endOfMonth,
  endOfQuarter,
  endOfYear,
  subWeeks,
  subMonths,
  subQuarters,
  subYears,
  startOfDay,
  format,
} from 'date-fns'

export type DateRangeType =
  | 'all'
  | 'today'
  | 'wtd'
  | 'mtd'
  | 'qtd'
  | 'ytd'
  | 'lastWeek'
  | 'lastMonth'
  | 'lastQuarter'
  | 'lastYear'
  | 'specificMonth'
  | 'custom'

export interface DateBounds {
  start: Date | null
  end: Date | null
}

export interface DateFilterState {
  dateRangeType: DateRangeType
  customStart: Date | null
  customEnd: Date | null
  selectedMonth: number // 0-11
  selectedYear: number
}

export const dateRangeLabels: Record<DateRangeType, string> = {
  all: 'All Time',
  today: 'Today',
  wtd: 'Week to Date',
  mtd: 'Month to Date',
  qtd: 'Quarter to Date',
  ytd: 'Year to Date',
  lastWeek: 'Last Week',
  lastMonth: 'Last Month',
  lastQuarter: 'Last Quarter',
  lastYear: 'Last Year',
  specificMonth: 'Specific Month',
  custom: 'Custom Range',
}

export const dateRangeShortLabels: Record<DateRangeType, string> = {
  all: 'All',
  today: 'Today',
  wtd: 'WTD',
  mtd: 'MTD',
  qtd: 'QTD',
  ytd: 'YTD',
  lastWeek: 'Last Week',
  lastMonth: 'Last Month',
  lastQuarter: 'Last Quarter',
  lastYear: 'Last Year',
  specificMonth: 'Month',
  custom: 'Custom',
}

// Quick filter options
export const quickFilterOptions: DateRangeType[] = ['all', 'today', 'wtd', 'mtd', 'qtd', 'ytd']

// Previous period options
export const previousPeriodOptions: DateRangeType[] = ['lastWeek', 'lastMonth', 'lastQuarter', 'lastYear']

// Get month name
export function getMonthName(month: number): string {
  const date = new Date(2000, month, 1)
  return format(date, 'MMMM')
}

// Get short month name
export function getShortMonthName(month: number): string {
  const date = new Date(2000, month, 1)
  return format(date, 'MMM')
}

// Get available years for selection (last 5 years + current)
export function getAvailableYears(): number[] {
  const currentYear = new Date().getFullYear()
  return Array.from({ length: 6 }, (_, i) => currentYear - i)
}

// Get available months
export function getAvailableMonths(): { value: number; label: string }[] {
  return Array.from({ length: 12 }, (_, i) => ({
    value: i,
    label: getMonthName(i),
  }))
}

// Today bounds
export function getTodayBounds(): DateBounds {
  const now = new Date()
  return {
    start: startOfDay(now),
    end: endOfDay(now),
  }
}

// Last week bounds
export function getLastWeekBounds(): DateBounds {
  const now = new Date()
  const lastWeek = subWeeks(now, 1)
  return {
    start: startOfWeek(lastWeek, { weekStartsOn: 0 }),
    end: endOfWeek(lastWeek, { weekStartsOn: 0 }),
  }
}

// Last month bounds
export function getLastMonthBounds(): DateBounds {
  const now = new Date()
  const lastMonth = subMonths(now, 1)
  return {
    start: startOfMonth(lastMonth),
    end: endOfMonth(lastMonth),
  }
}

// Last quarter bounds
export function getLastQuarterBounds(): DateBounds {
  const now = new Date()
  const lastQuarter = subQuarters(now, 1)
  return {
    start: startOfQuarter(lastQuarter),
    end: endOfQuarter(lastQuarter),
  }
}

// Last year bounds
export function getLastYearBounds(): DateBounds {
  const now = new Date()
  const lastYear = subYears(now, 1)
  return {
    start: startOfYear(lastYear),
    end: endOfYear(lastYear),
  }
}

// Specific month bounds
export function getSpecificMonthBounds(month: number, year: number): DateBounds {
  const date = new Date(year, month, 1)
  return {
    start: startOfMonth(date),
    end: endOfMonth(date),
  }
}

// Custom range bounds
export function getCustomRangeBounds(start: Date | null, end: Date | null): DateBounds {
  return {
    start: start ? startOfDay(start) : null,
    end: end ? endOfDay(end) : null,
  }
}

// Main function to get date bounds based on filter state
export function getDateBoundsFromState(state: DateFilterState): DateBounds {
  switch (state.dateRangeType) {
    case 'all':
      return { start: null, end: null }
    case 'today':
      return getTodayBounds()
    case 'wtd':
      return {
        start: startOfWeek(new Date(), { weekStartsOn: 0 }),
        end: endOfDay(new Date()),
      }
    case 'mtd':
      return {
        start: startOfMonth(new Date()),
        end: endOfDay(new Date()),
      }
    case 'qtd':
      return {
        start: startOfQuarter(new Date()),
        end: endOfDay(new Date()),
      }
    case 'ytd':
      return {
        start: startOfYear(new Date()),
        end: endOfDay(new Date()),
      }
    case 'lastWeek':
      return getLastWeekBounds()
    case 'lastMonth':
      return getLastMonthBounds()
    case 'lastQuarter':
      return getLastQuarterBounds()
    case 'lastYear':
      return getLastYearBounds()
    case 'specificMonth':
      return getSpecificMonthBounds(state.selectedMonth, state.selectedYear)
    case 'custom':
      return getCustomRangeBounds(state.customStart, state.customEnd)
    default:
      return { start: null, end: null }
  }
}

// Legacy function for backwards compatibility
export type DateRange = 'all' | 'wtd' | 'mtd' | 'qtd' | 'ytd'

export function getDateBounds(range: DateRange): DateBounds {
  if (range === 'all') {
    return { start: null, end: null }
  }

  const now = new Date()
  const end = endOfDay(now)
  let start: Date

  switch (range) {
    case 'wtd':
      start = startOfWeek(now, { weekStartsOn: 0 })
      break
    case 'mtd':
      start = startOfMonth(now)
      break
    case 'qtd':
      start = startOfQuarter(now)
      break
    case 'ytd':
      start = startOfYear(now)
      break
    default:
      return { start: null, end: null }
  }

  return { start, end }
}

export function isDateInRange(dateStr: string | undefined | null, bounds: DateBounds): boolean {
  // If no bounds (all time), include everything
  if (!bounds.start && !bounds.end) {
    return true
  }

  // If no date string, exclude from filtered results
  if (!dateStr) {
    return false
  }

  const date = new Date(dateStr)
  if (isNaN(date.getTime())) {
    return false
  }

  if (bounds.start && date < bounds.start) {
    return false
  }

  if (bounds.end && date > bounds.end) {
    return false
  }

  return true
}

// Format date range for display
export function formatDateRangeDisplay(state: DateFilterState): string {
  const bounds = getDateBoundsFromState(state)

  if (!bounds.start && !bounds.end) {
    return 'All Time'
  }

  if (state.dateRangeType === 'today') {
    return format(new Date(), 'MMM d, yyyy')
  }

  if (state.dateRangeType === 'specificMonth') {
    return format(new Date(state.selectedYear, state.selectedMonth, 1), 'MMMM yyyy')
  }

  if (state.dateRangeType === 'lastMonth') {
    const lastMonth = subMonths(new Date(), 1)
    return format(lastMonth, 'MMMM yyyy')
  }

  if (state.dateRangeType === 'lastQuarter') {
    const lastQuarter = subQuarters(new Date(), 1)
    const qStart = startOfQuarter(lastQuarter)
    const quarter = Math.floor(qStart.getMonth() / 3) + 1
    return `Q${quarter} ${qStart.getFullYear()}`
  }

  if (state.dateRangeType === 'lastYear') {
    return `${new Date().getFullYear() - 1}`
  }

  if (bounds.start && bounds.end) {
    return `${format(bounds.start, 'MMM d')} - ${format(bounds.end, 'MMM d, yyyy')}`
  }

  return dateRangeLabels[state.dateRangeType]
}

// Get the current quarter number (1-4)
export function getCurrentQuarter(): number {
  return Math.floor(new Date().getMonth() / 3) + 1
}

// Get previous period label with date info
export function getPreviousPeriodLabel(type: DateRangeType): string {
  switch (type) {
    case 'lastWeek': {
      const bounds = getLastWeekBounds()
      if (bounds.start && bounds.end) {
        return `Last Week (${format(bounds.start, 'MMM d')} - ${format(bounds.end, 'MMM d')})`
      }
      return 'Last Week'
    }
    case 'lastMonth': {
      const lastMonth = subMonths(new Date(), 1)
      return `Last Month (${format(lastMonth, 'MMMM yyyy')})`
    }
    case 'lastQuarter': {
      const lastQuarter = subQuarters(new Date(), 1)
      const qStart = startOfQuarter(lastQuarter)
      const quarter = Math.floor(qStart.getMonth() / 3) + 1
      return `Last Quarter (Q${quarter} ${qStart.getFullYear()})`
    }
    case 'lastYear':
      return `Last Year (${new Date().getFullYear() - 1})`
    default:
      return dateRangeLabels[type]
  }
}
