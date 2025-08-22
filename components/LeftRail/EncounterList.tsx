'use client'

import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { getStatusColor, getStatusText, formatDate } from '@/lib/utils'
import { Video, Clock, User, Phone, Copy, Link as LinkIcon, Calendar } from 'lucide-react'
import Link from 'next/link'
import { DebugPanel } from './DebugPanel'

interface EncounterListProps {
  providerId: string
  onEncounterSelect: (encounterId: string) => void
  activeEncounterId?: string
  debugData?: any
}

export function EncounterList({ providerId, onEncounterSelect, activeEncounterId, debugData }: EncounterListProps) {
  const encounters = useQuery(api.queries.encounters.listForProviderWithInvites, { providerId })
  const { toast, showToast, hideToast } = useToast()

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
        {todaysEncounters.map((encounter: any) => (
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
              <div className="flex items-center text-xs text-gray-500">
                {encounter.status === 'active' ? (
                  <Video className="w-3 h-3 mr-1 text-green-600" />
                ) : encounter.status === 'scheduled' ? (
                  <Clock className="w-3 h-3 mr-1 text-blue-600" />
                ) : (
                  <User className="w-3 h-3 mr-1 text-gray-600" />
                )}
                {encounter.scheduledAt ? formatDate(encounter.scheduledAt) : 'No time set'}
              </div>
            </CardContent>
          </Card>
        ))}
        
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
      </div>
      
      {/* Debug Panel - Expandable */}
      <DebugPanel debugData={debugData} encounterId={activeEncounterId} />
    </div>
  )
}
