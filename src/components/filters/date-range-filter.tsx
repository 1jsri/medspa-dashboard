'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { useDateFilter } from '@/contexts/date-filter-context'
import {
  DateRangeType,
  dateRangeLabels,
} from '@/lib/date-utils'
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react'
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  isSameDay,
  isSameMonth,
  isToday,
  eachDayOfInterval,
  isBefore,
  isAfter,
  startOfDay,
  endOfDay,
  startOfWeek as getStartOfWeek,
  startOfQuarter,
  startOfYear,
  endOfWeek as getEndOfWeek,
  endOfQuarter,
  endOfYear,
  subWeeks,
  subMonths as dateFnsSubMonths,
  subQuarters,
  subYears,
} from 'date-fns'

type PresetOption = {
  key: string
  label: string
  type: DateRangeType
  getRange?: () => { start: Date; end: Date }
}

const presets: PresetOption[] = [
  { key: 'today', label: 'Today', type: 'today', getRange: () => ({ start: startOfDay(new Date()), end: endOfDay(new Date()) }) },
  { key: 'wtd', label: 'This Week', type: 'wtd', getRange: () => ({ start: getStartOfWeek(new Date(), { weekStartsOn: 0 }), end: endOfDay(new Date()) }) },
  { key: 'mtd', label: 'This Month', type: 'mtd', getRange: () => ({ start: startOfMonth(new Date()), end: endOfDay(new Date()) }) },
  { key: 'qtd', label: 'This Quarter', type: 'qtd', getRange: () => ({ start: startOfQuarter(new Date()), end: endOfDay(new Date()) }) },
  { key: 'ytd', label: 'This Year', type: 'ytd', getRange: () => ({ start: startOfYear(new Date()), end: endOfDay(new Date()) }) },
  { key: 'divider1', label: '', type: 'all' },
  { key: 'lastWeek', label: 'Last Week', type: 'lastWeek', getRange: () => {
    const lastWeek = subWeeks(new Date(), 1)
    return { start: getStartOfWeek(lastWeek, { weekStartsOn: 0 }), end: getEndOfWeek(lastWeek, { weekStartsOn: 0 }) }
  }},
  { key: 'lastMonth', label: 'Last Month', type: 'lastMonth', getRange: () => {
    const lastMonth = dateFnsSubMonths(new Date(), 1)
    return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) }
  }},
  { key: 'lastQuarter', label: 'Last Quarter', type: 'lastQuarter', getRange: () => {
    const lastQuarter = subQuarters(new Date(), 1)
    return { start: startOfQuarter(lastQuarter), end: endOfQuarter(lastQuarter) }
  }},
  { key: 'lastYear', label: 'Last Year', type: 'lastYear', getRange: () => {
    const lastYear = subYears(new Date(), 1)
    return { start: startOfYear(lastYear), end: endOfYear(lastYear) }
  }},
  { key: 'divider2', label: '', type: 'all' },
  { key: 'all', label: 'All Time', type: 'all' },
]

function getDaysInMonth(date: Date): Date[] {
  const start = startOfWeek(startOfMonth(date), { weekStartsOn: 0 })
  const end = endOfWeek(endOfMonth(date), { weekStartsOn: 0 })
  return eachDayOfInterval({ start, end })
}

interface MonthCalendarProps {
  month: Date
  startDate: Date | null
  endDate: Date | null
  hoverDate: Date | null
  onDateClick: (date: Date) => void
  onDateHover: (date: Date | null) => void
  hideTitle?: boolean
}

function MonthCalendar({
  month,
  startDate,
  endDate,
  hoverDate,
  onDateClick,
  onDateHover,
  hideTitle = false,
}: MonthCalendarProps) {
  const days = useMemo(() => getDaysInMonth(month), [month])
  const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

  const isInRange = (day: Date): boolean => {
    if (!startDate) return false
    const effectiveEnd = endDate || hoverDate
    if (!effectiveEnd) return false

    const rangeStart = isBefore(startDate, effectiveEnd) ? startDate : effectiveEnd
    const rangeEnd = isAfter(startDate, effectiveEnd) ? startDate : effectiveEnd

    return (isAfter(day, rangeStart) || isSameDay(day, rangeStart)) &&
           (isBefore(day, rangeEnd) || isSameDay(day, rangeEnd))
  }

  const isRangeStart = (day: Date): boolean => {
    if (!startDate) return false
    const effectiveEnd = endDate || hoverDate
    if (!effectiveEnd) return isSameDay(day, startDate)

    const rangeStart = isBefore(startDate, effectiveEnd) ? startDate : effectiveEnd
    return isSameDay(day, rangeStart)
  }

  const isRangeEnd = (day: Date): boolean => {
    if (!startDate) return false
    const effectiveEnd = endDate || hoverDate
    if (!effectiveEnd) return false

    const rangeEnd = isAfter(startDate, effectiveEnd) ? startDate : effectiveEnd
    return isSameDay(day, rangeEnd)
  }

  return (
    <div className="w-[252px]">
      {!hideTitle && (
        <div className="text-center font-semibold text-slate-700 mb-3">
          {format(month, 'MMMM yyyy')}
        </div>
      )}
      <div className="grid grid-cols-7 gap-0">
        {weekDays.map((day) => (
          <div
            key={day}
            className="h-9 flex items-center justify-center text-xs font-medium text-slate-400"
          >
            {day}
          </div>
        ))}
        {days.map((day, idx) => {
          const inCurrentMonth = isSameMonth(day, month)
          const isSelected = (startDate && isSameDay(day, startDate)) || (endDate && isSameDay(day, endDate))
          const inRange = isInRange(day)
          const rangeStart = isRangeStart(day)
          const rangeEnd = isRangeEnd(day)
          const today = isToday(day)

          return (
            <div
              key={idx}
              className={`relative h-9 flex items-center justify-center ${
                inRange && !rangeStart && !rangeEnd ? 'bg-blue-50' : ''
              } ${rangeStart && inRange ? 'bg-gradient-to-r from-transparent to-blue-50' : ''}
              ${rangeEnd && inRange ? 'bg-gradient-to-l from-transparent to-blue-50' : ''}`}
            >
              <button
                onClick={() => inCurrentMonth && onDateClick(day)}
                onMouseEnter={() => inCurrentMonth && onDateHover(day)}
                onMouseLeave={() => onDateHover(null)}
                disabled={!inCurrentMonth}
                className={`
                  w-9 h-9 rounded-full text-sm transition-colors relative z-10
                  ${!inCurrentMonth ? 'text-slate-300 cursor-default' : 'cursor-pointer'}
                  ${inCurrentMonth && !isSelected ? 'hover:bg-slate-100' : ''}
                  ${isSelected ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}
                  ${today && !isSelected ? 'ring-1 ring-blue-400 ring-inset' : ''}
                  ${inCurrentMonth && !isSelected ? 'text-slate-700' : ''}
                `}
              >
                {format(day, 'd')}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function useIsMobile(breakpoint = 640): boolean {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia(`(max-width: ${breakpoint - 1}px)`)
    setIsMobile(mediaQuery.matches)

    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [breakpoint])

  return isMobile
}

export function DateRangeFilter() {
  const {
    dateRangeType,
    displayLabel,
    filterState,
    setDateRangeType,
    setCustomRange,
    reset,
  } = useDateFilter()

  const [isOpen, setIsOpen] = useState(false)
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)
  const [hoverDate, setHoverDate] = useState<Date | null>(null)
  const [leftMonth, setLeftMonth] = useState(() => {
    // Start with current month on the left
    return startOfMonth(new Date())
  })
  const dropdownRef = useRef<HTMLDivElement>(null)
  const isMobile = useIsMobile()

  // Sync internal state with context when panel opens
  useEffect(() => {
    if (isOpen) {
      if (filterState.dateRangeType === 'custom' && filterState.customStart && filterState.customEnd) {
        setStartDate(filterState.customStart)
        setEndDate(filterState.customEnd)
        setLeftMonth(startOfMonth(filterState.customStart))
      } else if (filterState.dateRangeType === 'specificMonth') {
        const monthStart = new Date(filterState.selectedYear, filterState.selectedMonth, 1)
        setStartDate(startOfMonth(monthStart))
        setEndDate(endOfMonth(monthStart))
        setLeftMonth(startOfMonth(monthStart))
      } else {
        setStartDate(null)
        setEndDate(null)
        setLeftMonth(startOfMonth(new Date()))
      }
    }
  }, [isOpen, filterState])

  // Close dropdown when clicking outside (desktop only - modal has backdrop click)
  useEffect(() => {
    if (isMobile) return // Modal handles its own close via backdrop

    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isMobile])

  // Close modal on Escape key
  useEffect(() => {
    if (!isOpen) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  // Prevent body scroll when modal is open on mobile
  useEffect(() => {
    if (isMobile && isOpen) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = ''
      }
    }
  }, [isMobile, isOpen])

  const handlePresetClick = (preset: PresetOption) => {
    if (preset.key.startsWith('divider')) return

    setDateRangeType(preset.type)
    setIsOpen(false)
  }

  const handleDateClick = (date: Date) => {
    if (!startDate || (startDate && endDate)) {
      // Start fresh selection
      setStartDate(date)
      setEndDate(null)
    } else {
      // Complete the range
      if (isBefore(date, startDate)) {
        setEndDate(startDate)
        setStartDate(date)
      } else {
        setEndDate(date)
      }
    }
  }

  const handleApply = () => {
    if (startDate && endDate) {
      setCustomRange(startOfDay(startDate), endOfDay(endDate))
      setIsOpen(false)
    } else if (startDate) {
      // Single day selected
      setCustomRange(startOfDay(startDate), endOfDay(startDate))
      setIsOpen(false)
    }
  }

  const handleClear = () => {
    setStartDate(null)
    setEndDate(null)
    reset()
    setIsOpen(false)
  }

  const navigateMonths = (direction: 'prev' | 'next') => {
    setLeftMonth(prev => direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1))
  }

  const getDisplayLabel = (): string => {
    // If we have a pending selection (custom range being selected but not yet applied)
    if (startDate && endDate && isOpen) {
      return `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}`
    }
    return displayLabel
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-sm"
      >
        <Calendar className="h-4 w-4 text-slate-500" />
        <span className="font-medium text-slate-700">{getDisplayLabel()}</span>
        <ChevronRight className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
      </button>

      {/* Desktop Panel - Dropdown */}
      {isOpen && !isMobile && (
        <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-xl border border-slate-200 z-50 overflow-hidden">
          <div className="flex flex-row">
            {/* Presets sidebar */}
            <div className="w-36 border-r border-slate-200 p-3 bg-slate-50">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 px-2">
                Presets
              </p>
              <div className="flex flex-col gap-0.5">
                {presets.map((preset) => {
                  if (preset.key.startsWith('divider')) {
                    return <div key={preset.key} className="h-px bg-slate-200 my-2" />
                  }

                  const isActive = dateRangeType === preset.type && !startDate && !endDate

                  return (
                    <button
                      key={preset.key}
                      onClick={() => handlePresetClick(preset)}
                      className={`
                        whitespace-nowrap px-3 py-1.5 rounded-md text-sm transition-colors w-full text-left
                        ${isActive
                          ? 'bg-blue-100 text-blue-700 font-medium'
                          : 'text-slate-600 hover:bg-slate-100'
                        }
                      `}
                    >
                      {preset.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Calendar section */}
            <div className="p-4">
              {/* Month Navigation */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => navigateMonths('prev')}
                  className="p-1 hover:bg-slate-100 rounded-md transition-colors"
                  aria-label="Previous month"
                >
                  <ChevronLeft className="h-5 w-5 text-slate-600" />
                </button>
                <div className="flex-1" />
                <button
                  onClick={() => navigateMonths('next')}
                  className="p-1 hover:bg-slate-100 rounded-md transition-colors"
                  aria-label="Next month"
                >
                  <ChevronRight className="h-5 w-5 text-slate-600" />
                </button>
              </div>

              {/* Single Calendar */}
              <MonthCalendar
                month={leftMonth}
                startDate={startDate}
                endDate={endDate}
                hoverDate={hoverDate}
                onDateClick={handleDateClick}
                onDateHover={setHoverDate}
              />

              {/* Helper text */}
              <p className="text-xs text-slate-400 text-center mt-4">
                {startDate && !endDate
                  ? 'Click another date to complete your range'
                  : 'Click a date to start, click another to end your range'
                }
              </p>

              {/* Action buttons */}
              <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-slate-100">
                <button
                  onClick={handleClear}
                  className="px-4 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                >
                  Clear
                </button>
                <button
                  onClick={handleApply}
                  disabled={!startDate}
                  className="px-4 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Panel - Modal with Backdrop */}
      {isOpen && isMobile && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOpen(false)
          }}
        >
          <div className="bg-white rounded-xl shadow-2xl mx-4 max-w-sm w-full max-h-[90vh] overflow-y-auto">
            {/* Header with close button */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
              <h2 className="font-semibold text-slate-800">Select Date Range</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-slate-100 rounded-md transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            {/* Presets as horizontal chips */}
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
              <div className="flex flex-wrap gap-2">
                {presets.filter(p => !p.key.startsWith('divider')).map((preset) => {
                  const isActive = dateRangeType === preset.type && !startDate && !endDate

                  return (
                    <button
                      key={preset.key}
                      onClick={() => handlePresetClick(preset)}
                      className={`
                        whitespace-nowrap px-3 py-1.5 rounded-full text-sm transition-colors
                        ${isActive
                          ? 'bg-blue-600 text-white font-medium'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                        }
                      `}
                    >
                      {preset.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Calendar section */}
            <div className="p-4">
              {/* Month Navigation */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => navigateMonths('prev')}
                  className="p-2 hover:bg-slate-100 rounded-md transition-colors"
                  aria-label="Previous month"
                >
                  <ChevronLeft className="h-5 w-5 text-slate-600" />
                </button>
                <span className="font-semibold text-slate-700">
                  {format(leftMonth, 'MMMM yyyy')}
                </span>
                <button
                  onClick={() => navigateMonths('next')}
                  className="p-2 hover:bg-slate-100 rounded-md transition-colors"
                  aria-label="Next month"
                >
                  <ChevronRight className="h-5 w-5 text-slate-600" />
                </button>
              </div>

              {/* Single Calendar (no month title since it's in nav) */}
              <div className="flex justify-center">
                <MonthCalendar
                  month={leftMonth}
                  startDate={startDate}
                  endDate={endDate}
                  hoverDate={hoverDate}
                  onDateClick={handleDateClick}
                  onDateHover={setHoverDate}
                  hideTitle
                />
              </div>

              {/* Helper text */}
              <p className="text-xs text-slate-400 text-center mt-4">
                {startDate && !endDate
                  ? 'Tap another date to complete your range'
                  : 'Tap a date to start, tap another to end'
                }
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 p-4 border-t border-slate-100">
              <button
                onClick={handleClear}
                className="flex-1 px-4 py-2.5 text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors font-medium"
              >
                Clear
              </button>
              <button
                onClick={handleApply}
                disabled={!startDate}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
