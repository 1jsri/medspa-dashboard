'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { useDateFilter } from '@/contexts/date-filter-context'
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react'
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addQuarters,
  subQuarters,
  isSameDay,
  isSameMonth,
  isToday,
  eachDayOfInterval,
  isBefore,
  isAfter,
  startOfDay,
  endOfDay,
  startOfQuarter,
  endOfQuarter,
} from 'date-fns'

type PeriodType = 'all' | 'wtd' | 'mtd' | 'qtd' | 'custom'

interface PeriodState {
  type: PeriodType
  offset: number // 0 = current, -1 = previous, -2 = two periods ago, etc.
}

function getDateRangeForPeriod(type: PeriodType, offset: number): { start: Date; end: Date } | null {
  const now = new Date()

  switch (type) {
    case 'wtd': {
      const targetWeekStart = offset === 0
        ? startOfWeek(now, { weekStartsOn: 0 })
        : startOfWeek(addWeeks(now, offset), { weekStartsOn: 0 })
      const targetWeekEnd = offset === 0
        ? endOfDay(now) // Week to date = start of week to now
        : endOfWeek(addWeeks(now, offset), { weekStartsOn: 0 })
      return { start: targetWeekStart, end: targetWeekEnd }
    }
    case 'mtd': {
      const targetMonth = offset === 0 ? now : addMonths(now, offset)
      const targetMonthStart = startOfMonth(targetMonth)
      const targetMonthEnd = offset === 0
        ? endOfDay(now) // Month to date = start of month to now
        : endOfMonth(targetMonth)
      return { start: targetMonthStart, end: targetMonthEnd }
    }
    case 'qtd': {
      const targetQuarter = offset === 0 ? now : addQuarters(now, offset)
      const targetQuarterStart = startOfQuarter(targetQuarter)
      const targetQuarterEnd = offset === 0
        ? endOfDay(now) // Quarter to date = start of quarter to now
        : endOfQuarter(targetQuarter)
      return { start: targetQuarterStart, end: targetQuarterEnd }
    }
    default:
      return null
  }
}

function formatPeriodLabel(type: PeriodType, offset: number): string {
  const range = getDateRangeForPeriod(type, offset)
  if (!range) return 'All Time'

  const { start, end } = range

  switch (type) {
    case 'wtd':
      return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`
    case 'mtd':
      if (offset === 0) {
        return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`
      }
      return format(start, 'MMMM yyyy')
    case 'qtd':
      const quarter = Math.floor(start.getMonth() / 3) + 1
      if (offset === 0) {
        return `Q${quarter} ${format(start, 'yyyy')}: ${format(start, 'MMM d')} - ${format(end, 'MMM d')}`
      }
      return `Q${quarter} ${format(start, 'yyyy')}`
    default:
      return 'All Time'
  }
}

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
}

function MonthCalendar({
  month,
  startDate,
  endDate,
  hoverDate,
  onDateClick,
  onDateHover,
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
    <div className="w-full max-w-[280px]">
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

export function DateRangeFilter() {
  const {
    setCustomRange,
    reset,
  } = useDateFilter()

  const [period, setPeriod] = useState<PeriodState>({ type: 'all', offset: 0 })
  const [showCustomPicker, setShowCustomPicker] = useState(false)
  const [customStart, setCustomStart] = useState<Date | null>(null)
  const [customEnd, setCustomEnd] = useState<Date | null>(null)
  const [hoverDate, setHoverDate] = useState<Date | null>(null)
  const [calendarMonth, setCalendarMonth] = useState(() => startOfMonth(new Date()))
  const pickerRef = useRef<HTMLDivElement>(null)

  // Apply filter when period changes
  useEffect(() => {
    if (period.type === 'all') {
      reset()
    } else if (period.type !== 'custom') {
      const range = getDateRangeForPeriod(period.type, period.offset)
      if (range) {
        setCustomRange(range.start, range.end)
      }
    }
  }, [period, reset, setCustomRange])

  // Close picker when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setShowCustomPicker(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handlePresetClick = (type: PeriodType) => {
    if (type === 'custom') {
      setShowCustomPicker(true)
      setCustomStart(null)
      setCustomEnd(null)
    } else {
      setPeriod({ type, offset: 0 })
      setShowCustomPicker(false)
    }
  }

  const handleNavigate = (direction: 'prev' | 'next') => {
    if (period.type === 'all' || period.type === 'custom') return

    const newOffset = direction === 'prev' ? period.offset - 1 : period.offset + 1
    // Don't allow going into the future
    if (newOffset > 0) return

    setPeriod({ ...period, offset: newOffset })
  }

  const handleDateClick = (date: Date) => {
    if (!customStart || (customStart && customEnd)) {
      setCustomStart(date)
      setCustomEnd(null)
    } else {
      if (isBefore(date, customStart)) {
        setCustomEnd(customStart)
        setCustomStart(date)
      } else {
        setCustomEnd(date)
      }
    }
  }

  const handleApplyCustom = () => {
    if (customStart && customEnd) {
      setCustomRange(startOfDay(customStart), endOfDay(customEnd))
      setPeriod({ type: 'custom', offset: 0 })
      setShowCustomPicker(false)
    } else if (customStart) {
      setCustomRange(startOfDay(customStart), endOfDay(customStart))
      setPeriod({ type: 'custom', offset: 0 })
      setShowCustomPicker(false)
    }
  }

  const canNavigateNext = period.offset < 0
  const showNavigation = period.type !== 'all' && period.type !== 'custom'

  const presets: { type: PeriodType; label: string }[] = [
    { type: 'all', label: 'All Time' },
    { type: 'wtd', label: 'WTD' },
    { type: 'mtd', label: 'MTD' },
    { type: 'qtd', label: 'QTD' },
    { type: 'custom', label: 'Custom' },
  ]

  const getDisplayRange = (): string => {
    if (period.type === 'custom' && customStart && customEnd) {
      return `${format(customStart, 'MMM d')} - ${format(customEnd, 'MMM d, yyyy')}`
    }
    return formatPeriodLabel(period.type, period.offset)
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Segmented Control */}
      <div className="inline-flex bg-slate-100 rounded-lg p-1">
        {presets.map(({ type, label }) => (
          <button
            key={type}
            onClick={() => handlePresetClick(type)}
            className={`
              px-3 py-1.5 text-sm font-medium rounded-md transition-all
              ${period.type === type
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
              }
            `}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Navigation Row - shows when a period preset is selected */}
      {showNavigation && (
        <div className="flex items-center justify-center gap-2 text-sm">
          <button
            onClick={() => handleNavigate('prev')}
            className="p-1 hover:bg-slate-100 rounded transition-colors"
            aria-label="Previous period"
          >
            <ChevronLeft className="h-4 w-4 text-slate-600" />
          </button>
          <span className="text-slate-700 font-medium min-w-[180px] text-center">
            {getDisplayRange()}
          </span>
          <button
            onClick={() => handleNavigate('next')}
            disabled={!canNavigateNext}
            className={`p-1 rounded transition-colors ${
              canNavigateNext
                ? 'hover:bg-slate-100 text-slate-600'
                : 'text-slate-300 cursor-not-allowed'
            }`}
            aria-label="Next period"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Custom Date Picker Popover */}
      {showCustomPicker && (
        <div
          ref={pickerRef}
          className="absolute top-full mt-2 right-0 bg-white rounded-xl shadow-xl border border-slate-200 z-50 p-4"
        >
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setCalendarMonth(prev => subMonths(prev, 1))}
              className="p-1 hover:bg-slate-100 rounded-md transition-colors"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-5 w-5 text-slate-600" />
            </button>
            <span className="font-semibold text-slate-700">
              {format(calendarMonth, 'MMMM yyyy')}
            </span>
            <button
              onClick={() => setCalendarMonth(prev => addMonths(prev, 1))}
              className="p-1 hover:bg-slate-100 rounded-md transition-colors"
              aria-label="Next month"
            >
              <ChevronRight className="h-5 w-5 text-slate-600" />
            </button>
          </div>

          {/* Calendar */}
          <MonthCalendar
            month={calendarMonth}
            startDate={customStart}
            endDate={customEnd}
            hoverDate={hoverDate}
            onDateClick={handleDateClick}
            onDateHover={setHoverDate}
          />

          {/* Selection Display */}
          {customStart && (
            <p className="text-sm text-slate-600 text-center mt-3">
              {customEnd
                ? `${format(customStart, 'MMM d')} - ${format(customEnd, 'MMM d, yyyy')}`
                : `${format(customStart, 'MMM d, yyyy')} - Select end date`
              }
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-slate-100">
            <button
              onClick={() => setShowCustomPicker(false)}
              className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApplyCustom}
              disabled={!customStart}
              className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
