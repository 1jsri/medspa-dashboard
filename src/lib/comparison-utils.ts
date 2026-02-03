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
  subDays,
  startOfDay,
  format,
  differenceInDays,
  getDay,
} from 'date-fns'
import type { DateFilterState, DateBounds } from './date-utils'

export interface ComparisonPeriod {
  bounds: DateBounds
  label: string
}

export interface ComparisonResult {
  value: number         // percentage change for dollar amounts, point change for rates
  isPositive: boolean
  label: string         // "vs November 2023"
  type: 'percent' | 'points'  // how to display the change
}

/**
 * Get the comparison period bounds and label based on the current filter state.
 * Returns null for 'all' time since there's no meaningful comparison.
 */
export function getComparisonPeriod(filterState: DateFilterState): ComparisonPeriod | null {
  const now = new Date()

  switch (filterState.dateRangeType) {
    case 'all':
      // No comparison for all time
      return null

    case 'today': {
      // Compare to same weekday last week
      const lastWeekSameDay = subWeeks(now, 1)
      const dayName = format(lastWeekSameDay, 'EEE')
      return {
        bounds: {
          start: startOfDay(lastWeekSameDay),
          end: endOfDay(lastWeekSameDay),
        },
        label: `vs last ${dayName}`,
      }
    }

    case 'wtd': {
      // Week to date - compare to same days last week
      const weekStart = startOfWeek(now, { weekStartsOn: 0 })
      const lastWeekStart = subWeeks(weekStart, 1)
      const dayOfWeek = getDay(now)
      const lastWeekSamePoint = subWeeks(now, 1)
      return {
        bounds: {
          start: lastWeekStart,
          end: endOfDay(lastWeekSamePoint),
        },
        label: 'vs last week',
      }
    }

    case 'mtd': {
      // Month to date - compare to same days last month
      const dayOfMonth = now.getDate()
      const lastMonthStart = startOfMonth(subMonths(now, 1))
      const lastMonthSameDay = subMonths(now, 1)
      // Adjust if last month had fewer days
      const lastMonthEnd = lastMonthSameDay.getDate() <= dayOfMonth
        ? endOfDay(lastMonthSameDay)
        : endOfMonth(lastMonthStart)

      const startLabel = format(lastMonthStart, 'MMM d')
      const endLabel = format(lastMonthEnd, 'd')
      return {
        bounds: {
          start: lastMonthStart,
          end: lastMonthEnd,
        },
        label: `vs ${startLabel}-${endLabel}`,
      }
    }

    case 'qtd': {
      // Quarter to date - compare to same days last quarter
      const quarterStart = startOfQuarter(now)
      const daysIntoQuarter = differenceInDays(now, quarterStart)
      const lastQuarterStart = startOfQuarter(subQuarters(now, 1))
      const lastQuarterSamePoint = subQuarters(now, 1)
      const quarter = Math.floor(lastQuarterStart.getMonth() / 3) + 1
      return {
        bounds: {
          start: lastQuarterStart,
          end: endOfDay(lastQuarterSamePoint),
        },
        label: `vs Q${quarter}`,
      }
    }

    case 'ytd': {
      // Year to date - compare to same days last year
      const yearStart = startOfYear(now)
      const lastYearStart = startOfYear(subYears(now, 1))
      const lastYearSamePoint = subYears(now, 1)
      return {
        bounds: {
          start: lastYearStart,
          end: endOfDay(lastYearSamePoint),
        },
        label: `vs ${lastYearStart.getFullYear()}`,
      }
    }

    case 'lastWeek': {
      // Last week - compare to the week before
      const lastWeekStart = subWeeks(startOfWeek(now, { weekStartsOn: 0 }), 1)
      const twoWeeksAgo = subWeeks(lastWeekStart, 1)
      const endOfTwoWeeksAgo = endOfWeek(twoWeeksAgo, { weekStartsOn: 0 })
      const startLabel = format(twoWeeksAgo, 'MMM d')
      const endLabel = format(endOfTwoWeeksAgo, 'd')
      return {
        bounds: {
          start: twoWeeksAgo,
          end: endOfTwoWeeksAgo,
        },
        label: `vs ${startLabel}-${endLabel}`,
      }
    }

    case 'lastMonth': {
      // Last month - compare to month before
      const twoMonthsAgo = subMonths(now, 2)
      const monthName = format(twoMonthsAgo, 'MMMM')
      return {
        bounds: {
          start: startOfMonth(twoMonthsAgo),
          end: endOfMonth(twoMonthsAgo),
        },
        label: `vs ${monthName}`,
      }
    }

    case 'lastQuarter': {
      // Last quarter - compare to quarter before
      const twoQuartersAgo = subQuarters(now, 2)
      const quarterStart = startOfQuarter(twoQuartersAgo)
      const quarter = Math.floor(quarterStart.getMonth() / 3) + 1
      return {
        bounds: {
          start: quarterStart,
          end: endOfQuarter(twoQuartersAgo),
        },
        label: `vs Q${quarter}`,
      }
    }

    case 'lastYear': {
      // Last year - compare to year before
      const twoYearsAgo = subYears(now, 2)
      return {
        bounds: {
          start: startOfYear(twoYearsAgo),
          end: endOfYear(twoYearsAgo),
        },
        label: `vs ${twoYearsAgo.getFullYear()}`,
      }
    }

    case 'specificMonth': {
      // Specific month - compare to same month last year
      const selectedDate = new Date(filterState.selectedYear, filterState.selectedMonth, 1)
      const lastYear = subYears(selectedDate, 1)
      const monthName = format(lastYear, 'MMM yyyy')
      return {
        bounds: {
          start: startOfMonth(lastYear),
          end: endOfMonth(lastYear),
        },
        label: `vs ${monthName}`,
      }
    }

    case 'custom': {
      // Custom range - compare to same duration prior
      if (!filterState.customStart || !filterState.customEnd) {
        return null
      }
      const duration = differenceInDays(filterState.customEnd, filterState.customStart)
      const previousEnd = subDays(filterState.customStart, 1)
      const previousStart = subDays(previousEnd, duration)
      const startLabel = format(previousStart, 'MMM d')
      const endLabel = format(previousEnd, 'MMM d')
      return {
        bounds: {
          start: startOfDay(previousStart),
          end: endOfDay(previousEnd),
        },
        label: `vs ${startLabel} - ${endLabel}`,
      }
    }

    default:
      return null
  }
}

/**
 * Calculate the comparison between current and previous values.
 * For dollar amounts: returns percentage change
 * For rates: returns percentage point change
 */
export function calculateComparison(
  currentValue: number,
  previousValue: number,
  label: string,
  isRateMetric: boolean = false
): ComparisonResult | null {
  // Hide comparison if no previous data
  if (previousValue === 0 || previousValue === null || previousValue === undefined) {
    // Exception: if current also has no value, still hide
    // If current has value but previous is 0, hide (avoid infinity)
    return null
  }

  if (isRateMetric) {
    // For rate metrics (conversion rate, close rate), show point change
    // Values are already decimals (0.45 = 45%)
    const pointChange = (currentValue - previousValue) * 100
    return {
      value: Math.abs(pointChange),
      isPositive: pointChange >= 0,
      label,
      type: 'points',
    }
  } else {
    // For dollar/count metrics, show percentage change
    const percentChange = ((currentValue - previousValue) / previousValue) * 100
    return {
      value: Math.abs(percentChange),
      isPositive: percentChange >= 0,
      label,
      type: 'percent',
    }
  }
}

/**
 * Format a comparison result for display
 */
export function formatComparisonDisplay(comparison: ComparisonResult): string {
  const arrow = comparison.isPositive ? '↑' : '↓'
  const valueStr = comparison.type === 'points'
    ? `${comparison.value.toFixed(1)} pts`
    : `${comparison.value.toFixed(1)}%`

  return `${arrow} ${valueStr} ${comparison.label}`
}
