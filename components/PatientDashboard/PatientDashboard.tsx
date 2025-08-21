'use client'

import { useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { PatientWaitingRoom } from './PatientWaitingRoom'
import { PatientMediaCanvas } from './PatientMediaCanvas'
import { ChatPanel } from '@/components/ChatPanel/ChatPanel'
import { MediaControls } from '@/components/MediaControls/MediaControls'
import { DebugPanel } from '@/components/LeftRail/DebugPanel'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  User, 
  Clock, 
  MessageSquare, 
  FileText, 
  Phone, 
  PhoneOff,
  Video,
  VideoOff
} from 'lucide-react'
import { formatTime } from '@/lib/utils'
import { livekitClient } from '@/lib/livekitClient'

interface PatientDashboardProps {
  encounterId: string
  participantId: string
  displayName: string
}

export function PatientDashboard({ 
  encounterId, 
  participantId, 
  displayName 
}: PatientDashboardProps) {
  const [isInCall, setIsInCall] = useState(false)
  const [debugData, setDebugData] = useState<any>(null)
  
  const encounter = useQuery(api.queries.encounters.getWithDetails, { encounterId: encounterId as any })

  const handleJoinCall = () => {
    setIsInCall(true)
  }

  const handleLeaveCall = () => {
    setIsInCall(false)
  }

  const handleBackToDashboard = () => {
    setIsInCall(false)
  }

  if (!encounter) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <User className="w-8 h-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Loading...
            </CardTitle>
            <p className="text-gray-600 mt-2">
              Preparing your telehealth session
            </p>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Welcome, {displayName}</h1>
              <p className="text-sm sm:text-base text-gray-600">Your telehealth session</p>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
              <div className="flex items-center space-x-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                <Clock className="w-4 h-4" />
                <span>{isInCall ? 'In Call' : 'Waiting for provider'}</span>
              </div>
              {isInCall && (
                <div className="flex items-center space-x-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                  <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse" />
                  <span>Connected</span>
                </div>
              )}
              {!isInCall ? (
                <Button 
                  size="lg" 
                  className="bg-primary hover:bg-primary/90 w-full sm:w-auto"
                  onClick={handleJoinCall}
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Join Call
                </Button>
              ) : (
                <Button 
                  size="lg" 
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={handleLeaveCall}
                >
                  <PhoneOff className="w-4 h-4 mr-2" />
                  Leave Call
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Left Panel - Session Info (Hidden on mobile, shown on desktop) */}
        <div className="hidden lg:block lg:w-80 bg-gray-50 border-r border-gray-200 p-4 space-y-6">
          {/* Session Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="w-5 h-5 mr-2" />
                Session Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <span className="font-medium text-gray-700">Provider:</span>
                <span className="ml-2 text-gray-900">Dr. Smith</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Scheduled:</span>
                <span className="ml-2 text-gray-900">
                  {encounter.scheduledAt ? formatTime(encounter.scheduledAt) : 'Not scheduled'}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Status:</span>
                <Badge className="ml-2" variant={encounter.status === 'active' ? 'default' : 'secondary'}>
                  {encounter.status === 'active' ? 'In Progress' : 'Scheduled'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <FileText className="w-4 h-4 mr-2" />
                View Medical History
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <MessageSquare className="w-4 h-4 mr-2" />
                Contact Support
              </Button>
            </CardContent>
          </Card>

          {/* Debug Panel - Expandable */}
          <DebugPanel debugData={debugData} encounterId={encounterId} />
        </div>

        {/* Center Stage - Full width on mobile */}
        <div className="flex-1 flex flex-col">
          {isInCall ? (
            <PatientMediaCanvas
              encounterId={encounterId}
              livekitRoom={encounter.room?.livekitRoom}
              participantId={participantId}
              displayName={displayName}
              onLeaveCall={handleLeaveCall}
              onDebugUpdate={setDebugData}
            />
          ) : (
            <PatientWaitingRoom
              encounterId={encounterId}
              participantId={participantId}
              displayName={displayName}
              onJoinCall={handleJoinCall}
            />
          )}
        </div>

        {/* Right Panel - Device Controls + Chat (Stacked on mobile) */}
        <div className="lg:w-80 bg-white lg:border-l border-gray-200 flex flex-col">
          <MediaControls 
            onTrackToggle={(kind, enabled) => {
              livekitClient.toggleTrack(kind, enabled)
            }}
            onDeviceChange={async (kind, deviceId) => {
              await livekitClient.replaceTrack(kind, deviceId)
            }}
          />
          <ChatPanel 
            encounterId={encounterId}
            participantId={participantId}
          />
        </div>
      </div>
    </div>
  )
}
