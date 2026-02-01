'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import {
  DateRangeType,
  DateBounds,
  DateFilterState,
  getDateBoundsFromState,
  formatDateRangeDisplay,
} from '@/lib/date-utils'

interface DateFilterContextType {
  // Current filter state
  dateRange: DateRangeType
  dateRangeType: DateRangeType
  dateBounds: DateBounds
  filterState: DateFilterState

  // Display helpers
  displayLabel: string

  // Setters for quick filters
  setDateRange: (range: DateRangeType) => void
  setDateRangeType: (type: DateRangeType) => void

  // Setters for specific month
  setSpecificMonth: (month: number, year: number) => void

  // Setters for custom range
  setCustomRange: (start: Date | null, end: Date | null) => void

  // Reset to all time
  reset: () => void
}

const DateFilterContext = createContext<DateFilterContextType | undefined>(undefined)

const initialState: DateFilterState = {
  dateRangeType: 'all',
  customStart: null,
  customEnd: null,
  selectedMonth: new Date().getMonth(),
  selectedYear: new Date().getFullYear(),
}

export function DateFilterProvider({ children }: { children: ReactNode }) {
  const [filterState, setFilterState] = useState<DateFilterState>(initialState)

  const dateBounds = getDateBoundsFromState(filterState)
  const displayLabel = formatDateRangeDisplay(filterState)

  // Set date range type (for quick filters and previous periods)
  const setDateRangeType = useCallback((type: DateRangeType) => {
    setFilterState((prev) => ({
      ...prev,
      dateRangeType: type,
    }))
  }, [])

  // Legacy setter for backwards compatibility
  const setDateRange = useCallback((range: DateRangeType) => {
    setDateRangeType(range)
  }, [setDateRangeType])

  // Set specific month
  const setSpecificMonth = useCallback((month: number, year: number) => {
    setFilterState((prev) => ({
      ...prev,
      dateRangeType: 'specificMonth',
      selectedMonth: month,
      selectedYear: year,
    }))
  }, [])

  // Set custom range
  const setCustomRange = useCallback((start: Date | null, end: Date | null) => {
    setFilterState((prev) => ({
      ...prev,
      dateRangeType: 'custom',
      customStart: start,
      customEnd: end,
    }))
  }, [])

  // Reset to all time
  const reset = useCallback(() => {
    setFilterState(initialState)
  }, [])

  return (
    <DateFilterContext.Provider
      value={{
        dateRange: filterState.dateRangeType,
        dateRangeType: filterState.dateRangeType,
        dateBounds,
        filterState,
        displayLabel,
        setDateRange,
        setDateRangeType,
        setSpecificMonth,
        setCustomRange,
        reset,
      }}
    >
      {children}
    </DateFilterContext.Provider>
  )
}

export function useDateFilter() {
  const context = useContext(DateFilterContext)
  if (context === undefined) {
    throw new Error('useDateFilter must be used within a DateFilterProvider')
  }
  return context
}
