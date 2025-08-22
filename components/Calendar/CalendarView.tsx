'use client'

import { useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight,
  Clock,
  User,
  Grid3X3,
  List
} from 'lucide-react'
import { 
  getCalendarDays, 
  isSameDay, 
  isToday, 
  formatCalendarTime,
  WEEKDAYS,
  MONTHS 
} from '@/lib/calendar'

interface CalendarViewProps {
  providerId: string
  onEncounterSelect?: (encounterId: string) => void
  className?: string
}

type ViewMode = 'month' | 'week'

export function CalendarView({ 
  providerId, 
  onEncounterSelect,
  className = '' 
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<ViewMode>('month')

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const encounters = useQuery(api.queries.calendar.getEncountersForMonth, {
    providerId,
    year,
    month,
  })

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    if (direction === 'prev') {
      newDate.setMonth(month - 1)
    } else {
      newDate.setMonth(month + 1)
    }
    setCurrentDate(newDate)
  }

  const navigateToToday = () => {
    setCurrentDate(new Date())
  }

  const getEncountersForDay = (date: Date) => {
    if (!encounters) return []
    return encounters.filter(encounter => {
      if (!encounter.scheduledAt) return false
      return isSameDay(new Date(encounter.scheduledAt), date)
    })
  }

  const calendarDays = getCalendarDays(year, month)

  if (!encounters) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            Calendar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="grid grid-cols-7 gap-2 mb-4">
              {[...Array(7)].map((_, i) => (
                <div key={i} className="h-8 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {[...Array(35)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            {MONTHS[month]} {year}
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Button
                variant={viewMode === 'month' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('month')}
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'week' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('week')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
            <Button variant="outline" size="sm" onClick={navigateToToday}>
              Today
            </Button>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {viewMode === 'month' ? (
          <div className="space-y-4">
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-2">
              {WEEKDAYS.map(day => (
                <div key={day} className="text-center text-sm font-medium text-gray-600 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((date, index) => {
                const dayEncounters = getEncountersForDay(date)
                const isCurrentMonth = date.getMonth() === month
                const isDayToday = isToday(date)

                return (
                  <div
                    key={index}
                    className={`
                      min-h-[80px] p-2 border rounded-lg transition-colors cursor-pointer
                      ${isCurrentMonth ? 'bg-white hover:bg-gray-50' : 'bg-gray-50 text-gray-400'}
                      ${isDayToday ? 'ring-2 ring-blue-500' : ''}
                    `}
                  >
                    <div className={`text-sm font-medium mb-1 ${isDayToday ? 'text-blue-600' : ''}`}>
                      {date.getDate()}
                    </div>
                    <div className="space-y-1">
                      {dayEncounters.slice(0, 2).map((encounter: any) => (
                        <div
                          key={encounter._id}
                          onClick={() => onEncounterSelect?.(encounter._id)}
                          className="text-xs p-1 bg-blue-100 text-blue-800 rounded cursor-pointer hover:bg-blue-200 transition-colors"
                        >
                          <div className="flex items-center gap-1">
                            <Clock className="w-2 h-2" />
                            <span>{formatCalendarTime(new Date(encounter.scheduledAt))}</span>
                          </div>
                          <div className="truncate">
                            {encounter.patient?.displayName || encounter.patientHint?.value || 'Patient'}
                          </div>
                        </div>
                      ))}
                      {dayEncounters.length > 2 && (
                        <div className="text-xs text-gray-500 text-center">
                          +{dayEncounters.length - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Week View - List of encounters */}
            <div className="space-y-2">
              {encounters
                .filter(encounter => encounter.scheduledAt)
                .sort((a, b) => (a.scheduledAt || 0) - (b.scheduledAt || 0))
                .map((encounter: any) => (
                  <div
                    key={encounter._id}
                    onClick={() => onEncounterSelect?.(encounter._id)}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-sm font-medium text-gray-900">
                        {new Date(encounter.scheduledAt).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                      <div className="text-sm text-gray-600">
                        {formatCalendarTime(new Date(encounter.scheduledAt))}
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium">
                          {encounter.patient?.displayName || encounter.patientHint?.value || 'Patient'}
                        </span>
                      </div>
                    </div>
                    <Badge variant={encounter.status === 'active' ? 'default' : 'secondary'}>
                      {encounter.status}
                    </Badge>
                  </div>
                ))}
              
              {encounters.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <CalendarIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-sm">No encounters scheduled this month</p>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
