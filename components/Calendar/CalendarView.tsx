'use client'

import { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, ChevronLeft, ChevronRight, Clock, User, Edit, Trash2 } from 'lucide-react'
import { formatDate, formatTime } from '@/lib/utils'
import { getDaysInMonth, getStartOfMonth, getMonthName } from '@/lib/calendar'

interface CalendarViewProps {
  providerId: string
}

export function CalendarView({ providerId }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month')
  const [selectedEncounter, setSelectedEncounter] = useState<any>(null)
  const [isRescheduling, setIsRescheduling] = useState(false)
  const [newDateTime, setNewDateTime] = useState('')
  const [encounterToDelete, setEncounterToDelete] = useState<any>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const encounters = useQuery(api.queries.calendar.getEncountersForMonth, {
    providerId,
    year,
    month,
  })

  const rescheduleEncounter = useMutation(api.mutations.scheduling.rescheduleEncounter)
  const deleteEncounter = useMutation(api.mutations.scheduling.deleteEncounter)

  const daysInMonth = getDaysInMonth(year, month)
  const startOfMonth = getStartOfMonth(year, month)
  const startDay = startOfMonth.getDay()

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const handleReschedule = async () => {
    if (!selectedEncounter || !newDateTime) return

    try {
      const newTimestamp = new Date(newDateTime).getTime()
      await rescheduleEncounter({
        encounterId: selectedEncounter._id,
        newScheduledAt: newTimestamp,
      })
      setSelectedEncounter(null)
      setIsRescheduling(false)
      setNewDateTime('')
    } catch (error) {
      console.error('Failed to reschedule encounter:', error)
    }
  }

    const handleDelete = async () => {
    if (!encounterToDelete) return
    
    try {
      setIsDeleting(true)
      await deleteEncounter({
        encounterId: encounterToDelete._id,
      })
      setEncounterToDelete(null)
    } catch (error: any) {
      console.error('Failed to delete encounter:', error)
      
      // Provide specific error messages based on the error
      if (error.message?.includes('Cannot delete an active encounter')) {
        alert('Cannot delete an active encounter. Please end the call first before deleting.')
      } else {
        alert('Failed to delete encounter. Please try again.')
      }
    } finally {
      setIsDeleting(false)
    }
  }

  const getEncountersForDay = (day: number) => {
    if (!encounters) return []
    
    const dayStart = new Date(year, month, day, 0, 0, 0, 0).getTime()
    const dayEnd = new Date(year, month, day, 23, 59, 59, 999).getTime()
    
    return encounters.filter((encounter: any) => {
      if (!encounter.scheduledAt) return false
      const encounterTime = encounter.scheduledAt
      return encounterTime >= dayStart && encounterTime <= dayEnd
    })
  }

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
              <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Calendar</h1>
            <p className="text-gray-600">View and manage your scheduled encounters</p>
          </div>
          <div className="flex items-center space-x-4">
            {/* View Mode Selector */}
            <div className="flex items-center space-x-2 mr-4">
              <Button
                variant={viewMode === 'month' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('month')}
              >
                Month
              </Button>
              <Button
                variant={viewMode === 'week' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('week')}
              >
                Week
              </Button>
              <Button
                variant={viewMode === 'day' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('day')}
              >
                Day
              </Button>
            </div>
            
            <Button 
              variant="outline" 
              onClick={handlePreviousMonth}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            <h2 className="text-xl font-semibold text-gray-900">
              {getMonthName(month)} {year}
            </h2>
            <Button 
              variant="outline" 
              onClick={handleNextMonth}
              className="flex items-center gap-2"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
                </div>

        {/* Quick Actions */}
        {encounters && encounters.length > 0 && (
          <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-blue-900">Quick Actions</h3>
                <p className="text-xs text-blue-700">
                  {encounters.filter((e: any) => e.status === 'scheduled').length} scheduled encounters
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const scheduledEncounters = encounters.filter((e: any) => e.status === 'scheduled')
                    if (scheduledEncounters.length > 0) {
                      if (confirm(`Delete all ${scheduledEncounters.length} scheduled encounters?`)) {
                        scheduledEncounters.forEach(async (encounter: any) => {
                          try {
                            await deleteEncounter({ encounterId: encounter._id })
                          } catch (error) {
                            console.error('Failed to delete encounter:', error)
                          }
                        })
                      }
                    }
                  }}
                  className="text-red-600 hover:text-red-800 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Clear All Scheduled
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Calendar Grid */}
      <Card>
        <CardContent className="p-6">
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekdays.map((day) => (
              <div key={day} className="text-center font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for days before month starts */}
            {Array.from({ length: startDay }, (_, i) => (
              <div key={`empty-${i}`} className="h-32 bg-gray-50 rounded-lg" />
            ))}

            {/* Days of the month */}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1
              const dayEncounters = getEncountersForDay(day)
              const isToday = new Date().toDateString() === new Date(year, month, day).toDateString()

              return (
                <div
                  key={day}
                  className={`h-32 border rounded-lg p-2 ${
                    isToday ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm font-medium ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                      {day}
                    </span>
                    {isToday && (
                      <div className="w-2 h-2 bg-blue-600 rounded-full" />
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    {dayEncounters.map((encounter: any) => {
                      const isActive = encounter.status === 'active'
                      const isScheduled = encounter.status === 'scheduled'
                      
                      return (
                        <div
                          key={encounter._id}
                          className={`text-xs p-1 rounded cursor-pointer group ${
                            isActive 
                              ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' 
                              : isScheduled 
                              ? 'bg-green-100 text-green-800 hover:bg-green-200'
                              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                          }`}
                          onClick={() => setSelectedEncounter(encounter)}
                        >
                          <div className="flex items-center justify-between">
                            <span className="truncate">
                              {encounter.patient?.displayName || encounter.patientHint?.value || 'Patient'}
                            </span>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-4 w-4 p-0 hover:bg-red-50"
                                title="Reschedule encounter"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedEncounter(encounter)
                                  setIsRescheduling(true)
                                }}
                              >
                                <Edit className="w-3 h-3 text-blue-600" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className={`h-4 w-4 p-0 ${
                                  isActive 
                                    ? 'text-gray-400 cursor-not-allowed hover:bg-gray-50' 
                                    : 'text-red-600 hover:bg-red-50 hover:text-red-800'
                                }`}
                                title={isActive ? 'Cannot delete active encounter' : 'Delete encounter'}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  if (isActive) {
                                    alert('Cannot delete an active encounter. Please end the call first.')
                                    return
                                  }
                                  setEncounterToDelete(encounter)
                                }}
                                disabled={isActive}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                          <div className={`text-xs ${
                            isActive ? 'text-blue-700' : isScheduled ? 'text-green-700' : 'text-gray-700'
                          }`}>
                            {formatTime(encounter.scheduledAt)}
                            {isActive && <span className="ml-1">• Active</span>}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Reschedule Modal */}
      {selectedEncounter && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Reschedule Encounter</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Patient:</strong> {selectedEncounter.patient?.displayName || selectedEncounter.patientHint?.value || 'Patient'}
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Current Time:</strong> {formatTime(selectedEncounter.scheduledAt)}
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Status:</strong> 
                  <span className={`ml-1 px-2 py-1 rounded text-xs ${
                    selectedEncounter.status === 'active' 
                      ? 'bg-blue-100 text-blue-800' 
                      : selectedEncounter.status === 'scheduled'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedEncounter.status === 'active' ? 'Active' : 
                     selectedEncounter.status === 'scheduled' ? 'Scheduled' : 
                     selectedEncounter.status}
                  </span>
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={newDateTime}
                  onChange={(e) => setNewDateTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex space-x-2">
                <Button onClick={handleReschedule} disabled={!newDateTime}>
                  Reschedule
                </Button>
                <Button 
                  variant="destructive" 
                  disabled={selectedEncounter.status === 'active'}
                  onClick={() => {
                    if (selectedEncounter.status === 'active') {
                      alert('Cannot delete an active encounter. Please end the call first.')
                      return
                    }
                    setEncounterToDelete(selectedEncounter)
                    setSelectedEncounter(null)
                    setIsRescheduling(false)
                    setNewDateTime('')
                  }}
                  title={selectedEncounter.status === 'active' ? 'Cannot delete active encounter' : 'Delete encounter'}
                >
                  Delete
                </Button>
                <Button variant="outline" onClick={() => {
                  setSelectedEncounter(null)
                  setIsRescheduling(false)
                  setNewDateTime('')
                }}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {encounterToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="text-red-600">Delete Encounter</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  Are you sure you want to delete this encounter?
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Patient:</strong> {encounterToDelete.patient?.displayName || encounterToDelete.patientHint?.value || 'Patient'}
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Scheduled Time:</strong> {formatTime(encounterToDelete.scheduledAt)}
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Status:</strong> 
                  <span className={`ml-1 px-2 py-1 rounded text-xs ${
                    encounterToDelete.status === 'active' 
                      ? 'bg-blue-100 text-blue-800' 
                      : encounterToDelete.status === 'scheduled'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {encounterToDelete.status === 'active' ? 'Active' : 
                     encounterToDelete.status === 'scheduled' ? 'Scheduled' : 
                     encounterToDelete.status}
                  </span>
                </p>
                {encounterToDelete.status === 'active' && (
                  <p className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
                    ⚠️ This encounter is currently active. You may need to end the call first.
                  </p>
                )}
                <p className="text-sm text-red-600 font-medium">
                  This action cannot be undone.
                </p>
              </div>

              <div className="flex space-x-2">
                <Button 
                  variant="destructive" 
                  onClick={handleDelete} 
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setEncounterToDelete(null)}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
