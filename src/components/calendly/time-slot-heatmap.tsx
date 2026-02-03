'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TimeSlotStats } from '@/types/calendly'

interface TimeSlotHeatmapProps {
  timeSlotStats: TimeSlotStats[]
  topTimeSlots: Array<{ label: string; count: number }>
  className?: string
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const HOURS = Array.from({ length: 12 }, (_, i) => i + 8) // 8 AM to 7 PM

export function TimeSlotHeatmap({ timeSlotStats, topTimeSlots, className }: TimeSlotHeatmapProps) {
  // Build a lookup map for quick access
  const slotMap = new Map<string, number>()
  let maxCount = 0
  for (const slot of timeSlotStats) {
    const key = `${slot.dayOfWeek}-${slot.hour}`
    slotMap.set(key, slot.count)
    if (slot.count > maxCount) maxCount = slot.count
  }

  // Get color intensity based on count
  const getColor = (count: number) => {
    if (count === 0) return 'bg-slate-50'
    const intensity = count / maxCount
    if (intensity > 0.75) return 'bg-indigo-600 text-white'
    if (intensity > 0.5) return 'bg-indigo-400 text-white'
    if (intensity > 0.25) return 'bg-indigo-200'
    return 'bg-indigo-100'
  }

  const formatHour = (hour: number) => {
    if (hour === 12) return '12p'
    if (hour > 12) return `${hour - 12}p`
    return `${hour}a`
  }

  return (
    <div className={className}>
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Heatmap */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Booking Heatmap</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr>
                    <th className="p-1"></th>
                    {DAYS.map(day => (
                      <th key={day} className="p-1 font-medium text-slate-600">
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {HOURS.map(hour => (
                    <tr key={hour}>
                      <td className="p-1 font-medium text-slate-500 text-right pr-2">
                        {formatHour(hour)}
                      </td>
                      {DAYS.map((_, dayIndex) => {
                        const count = slotMap.get(`${dayIndex}-${hour}`) || 0
                        return (
                          <td key={dayIndex} className="p-0.5">
                            <div
                              className={`w-full h-6 rounded flex items-center justify-center text-[10px] font-medium ${getColor(count)}`}
                              title={`${DAYS[dayIndex]} ${formatHour(hour)}: ${count} bookings`}
                            >
                              {count > 0 ? count : ''}
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500">
              <span>Less</span>
              <div className="flex gap-1">
                <div className="w-4 h-4 rounded bg-slate-50 border border-slate-200" />
                <div className="w-4 h-4 rounded bg-indigo-100" />
                <div className="w-4 h-4 rounded bg-indigo-200" />
                <div className="w-4 h-4 rounded bg-indigo-400" />
                <div className="w-4 h-4 rounded bg-indigo-600" />
              </div>
              <span>More</span>
            </div>
          </CardContent>
        </Card>

        {/* Top Time Slots */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Time Slots</CardTitle>
          </CardHeader>
          <CardContent>
            {topTimeSlots.length === 0 ? (
              <p className="text-sm text-slate-500">No booking data available</p>
            ) : (
              <div className="space-y-3">
                {topTimeSlots.map((slot, index) => {
                  const maxSlotCount = topTimeSlots[0]?.count || 1
                  const widthPercent = (slot.count / maxSlotCount) * 100
                  return (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{slot.label}</span>
                        <span className="text-slate-500">{slot.count} bookings</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-100">
                        <div
                          className="h-2 rounded-full bg-indigo-500 transition-all"
                          style={{ width: `${widthPercent}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
