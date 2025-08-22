'use client'

import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useToast, Toast } from '@/components/ui/toast'
import { getStatusColor, getStatusText, formatDate } from '@/lib/utils'
import { Video, Clock, User, Phone, Copy, Link as LinkIcon, Calendar } from 'lucide-react'
import Link from 'next/link'
import { DebugPanel } from './DebugPanel'
import { useEffect, useRef } from 'react'

interface EncounterListProps {
  providerId: string
  onEncounterSelect: (encounterId: string) => void
  activeEncounterId?: string
  debugData?: any
}

export function EncounterList({ providerId, onEncounterSelect, activeEncounterId, debugData }: EncounterListProps) {
  const encounters = useQuery(api.queries.encounters.listForProviderWithInvites, { providerId })
  const { toast, showToast, hideToast } = useToast()
  
  // Track previous check-in states for toast notifications
  const previousStates = useRef<Record<string, string>>({})

  // Filter to today's encounters by default
  const todaysEncounters = encounters?.filter((encounter: any) => {
    if (!encounter.scheduledAt) return true // Include encounters without scheduled time
    const encounterDate = new Date(encounter.scheduledAt)
    const today = new Date()
    return encounterDate.toDateString() === today.toDateString()
  }) || []

  if (!encounters) {
    return (
      <div className="w-80 bg-gray-50 p-4">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="w-80 bg-gray-50 border-r border-gray-200 flex flex-col h-[85vh]">
      {/* Header - Fixed */}
      <div className="p-4 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Today&apos;s Encounters</h2>
          <Link href="/provider/calendar">
            <Button variant="ghost" size="sm" className="text-xs">
              <Calendar className="w-3 h-3 mr-1" />
              View Calendar
            </Button>
          </Link>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 relative">
        <div className="space-y-3">
          {todaysEncounters.map((encounter: any) => {
            const EncounterPresence = () => {
              const presence = useQuery(api.queries.presence.summary, { encounterId: encounter._id })
              
              // Track check-in state changes for toast notifications
              useEffect(() => {
                if (!presence) return
                
                const previousState = previousStates.current[encounter._id]
                const currentState = presence.checkInState
                
                if (previousState && previousState !== currentState) {
                  // Show toast for state transitions
                  switch (currentState) {
                    case 'arrived':
                      showToast(`Patient has arrived for encounter`)
                      break
                    case 'in-call':
                      showToast(`Patient joined the call`)
                      break
                    case 'workflow':
                      showToast(`Encounter moved to workflow mode`)
                      break
                  }
                }
                
                // Update previous state
                previousStates.current[encounter._id] = currentState
              }, [presence?.checkInState, encounter._id, showToast])
              
              if (!presence) return null
              
              const getCheckInBadge = () => {
                switch (presence.checkInState) {
                  case 'arrived':
                    return (
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full mr-1" />
                        Arrived
                      </Badge>
                    )
                  case 'in-call':
                    return (
                      <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-1" />
                        In Call
                      </Badge>
                    )
                  case 'workflow':
                    return (
                      <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-1" />
                        Workflow
                      </Badge>
                    )
                  default:
                    return (
                      <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-200">
                        <div className="w-2 h-2 bg-gray-400 rounded-full mr-1" />
                        Not Arrived
                      </Badge>
                    )
                }
              }
              
              return (
                <div className="flex items-center space-x-2">
                  {getCheckInBadge()}
                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    <span>{presence.onlineCount} online</span>
                  </div>
                </div>
              )
            }

            return (
              <Card
                key={encounter._id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  activeEncounterId === encounter._id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => onEncounterSelect(encounter._id)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium truncate">
                    {encounter.patientHint?.value || 'Patient'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge className={getStatusColor(encounter.status)}>
                      {getStatusText(encounter.status)}
                    </Badge>
                    <div className="flex space-x-1">
                      {encounter.invites && encounter.invites.length > 0 && (
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation()
                            const invite = encounter.invites[0] // Use the first invite
                            const inviteUrl = `${window.location.origin}/${encounter.providerRoom}/${invite.oit}`
                            navigator.clipboard.writeText(inviteUrl)
                            showToast('Invite link copied!')
                            console.log('📋 Copied invite URL:', inviteUrl)
                          }}
                          title="Copy invite link"
                        >
                          <LinkIcon className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center">
                      {encounter.status === 'active' ? (
                        <Video className="w-3 h-3 mr-1 text-green-600" />
                      ) : encounter.status === 'scheduled' ? (
                        <Clock className="w-3 h-3 mr-1 text-blue-600" />
                      ) : (
                        <User className="w-3 h-3 mr-1 text-gray-600" />
                      )}
                      {encounter.scheduledAt ? formatDate(encounter.scheduledAt) : 'No time set'}
                    </div>
                    <EncounterPresence />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
        
        {todaysEncounters.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <User className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-sm">No encounters yet</p>
            <p className="text-xs">Schedule your first patient encounter</p>
          </div>
        )}
        
        {/* Scroll fade indicator - only show when there are many encounters */}
        {todaysEncounters.length > 5 && (
          <div className="h-8 bg-gradient-to-t from-gray-50 to-transparent pointer-events-none" />
        )}
      </div>
      
      {/* Toast Notification */}
      <Toast
        message={toast.message}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
    </div>
  )
}
