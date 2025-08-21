'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { EncounterList } from '@/components/LeftRail/EncounterList'
import { MediaCanvas } from '@/components/CenterStage/MediaCanvas'
import { WorkflowMode } from '@/components/CenterStage/WorkflowMode'
import { ChatPanel } from '@/components/ChatPanel/ChatPanel'
import { MediaControls } from '@/components/MediaControls/MediaControls'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Button } from '@/components/ui/button'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { Calendar, User, FileText, Settings } from 'lucide-react'
import { livekitClient } from '@/lib/livekitClient'

export default function ProviderDashboard() {
  const [activeEncounterId, setActiveEncounterId] = useState<string | null>(null)
  const [isInMedia, setIsInMedia] = useState(false)
  const [providerId, setProviderId] = useState<string | null>(null)
  const [debugData, setDebugData] = useState<any>(null)
  const [isResetting, setIsResetting] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const resetOits = useMutation(api.mutations.resetOits.resetOits)

  const activeEncounter = useQuery(api.queries.encounters.getWithDetails, 
    activeEncounterId ? { encounterId: activeEncounterId as any } : 'skip'
  )

  // Initialize state from URL on mount
  useEffect(() => {
    const encounterId = searchParams.get('encounterId')
    const media = searchParams.get('media') === 'true'
    
    if (encounterId) {
      setActiveEncounterId(encounterId)
      setIsInMedia(media)
    }
  }, [searchParams])

  useEffect(() => {
    // Check if provider is logged in
    const storedProviderId = localStorage.getItem('providerId')
    if (!storedProviderId) {
      router.push('/provider/login')
      return
    }
    setProviderId(storedProviderId)
  }, [router])

  // Update URL when state changes
  const updateUrl = (encounterId: string | null, media: boolean) => {
    const params = new URLSearchParams()
    if (encounterId) {
      params.set('encounterId', encounterId)
      if (media) {
        params.set('media', 'true')
      }
    }
    
    const newUrl = params.toString() ? `?${params.toString()}` : ''
    router.replace(`/provider/dashboard${newUrl}`, { scroll: false })
  }

  const handleEncounterSelect = (encounterId: string) => {
    setActiveEncounterId(encounterId)
    setIsInMedia(false)
    updateUrl(encounterId, false)
  }

  const handleJoinMedia = () => {
    setIsInMedia(true)
    if (activeEncounterId) {
      updateUrl(activeEncounterId, true)
    }
  }

  const handleLeaveMedia = () => {
    setIsInMedia(false)
    if (activeEncounterId) {
      updateUrl(activeEncounterId, false)
    }
  }

  const handleBackToEncounter = () => {
    setIsInMedia(false)
    if (activeEncounterId) {
      updateUrl(activeEncounterId, false)
    }
  }

  const handleBackToDashboard = () => {
    setActiveEncounterId(null)
    setIsInMedia(false)
    updateUrl(null, false)
  }

  const handleResetOits = async () => {
    if (isResetting) return
    
    setIsResetting(true)
    try {
      const result = await resetOits()
      console.log('✅ OITs reset successfully:', result)
      
      // Refresh the page to show new encounters
      window.location.reload()
    } catch (error) {
      console.error('❌ Failed to reset OITs:', error)
      alert('Failed to reset OITs. Please try again.')
    } finally {
      setIsResetting(false)
    }
  }

  if (!providerId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Sign in required</h2>
          <p className="text-gray-600 mb-4">Please sign in to access your provider dashboard.</p>
          <Link href="/provider/login">
            <Button>Go to Sign In</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Top Header - Provider Info Only */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-medium">
                DP
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Dr. Demo Provider</p>
                <p className="text-xs text-gray-500">Online</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Left Panel - Encounters (Always Visible) */}
        <EncounterList
          providerId={providerId}
          onEncounterSelect={handleEncounterSelect}
          activeEncounterId={activeEncounterId || undefined}
          debugData={debugData}
        />

        {/* Center Stage - Dynamic Content */}
        <div className="flex-1 flex flex-col">
          {/* Back Button - Visible when in Encounter view or call */}
          {activeEncounterId && (
            <div className="bg-white border-b border-gray-200 p-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={isInMedia ? handleBackToEncounter : handleBackToDashboard}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {isInMedia ? 'Back to Encounter' : 'Back to Dashboard'}
              </Button>
            </div>
          )}

          {/* Dynamic Content Area */}
          <div className="flex-1">
            {activeEncounterId ? (
              isInMedia ? (
                <MediaCanvas
                  encounterId={activeEncounterId}
                  livekitRoom={activeEncounter?.room?.livekitRoom}
                  isProvider={true}
                  onJoinMedia={handleJoinMedia}
                  onLeaveMedia={handleLeaveMedia}
                  onDebugUpdate={setDebugData}
                />
              ) : (
                <WorkflowMode 
                  encounterId={activeEncounterId} 
                  onJoinCall={handleJoinMedia}
                />
              )
            ) : (
              <div className="flex-1 flex items-center justify-center bg-gray-50 p-8">
                <div className="max-w-2xl w-full">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                      Welcome to Encounters
                    </h2>
                    <p className="text-gray-600">
                      Select an encounter from the left panel to get started
                    </p>
                  </div>
                  
                  {/* Scheduler Placeholder */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Today's Schedule */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                                             <h3 className="text-lg font-semibold text-gray-900 mb-4">Today&apos;s Schedule</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                          <div>
                            <p className="font-medium text-blue-900">bob.wilson@example.com</p>
                            <p className="text-sm text-blue-700">20:09 - Waiting Room</p>
                          </div>
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900">jane.smith@example.com</p>
                            <p className="text-sm text-gray-700">19:09 - Scheduled</p>
                          </div>
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900">john.doe@example.com</p>
                            <p className="text-sm text-gray-700">19:14 - Scheduled</p>
                          </div>
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        </div>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                      <div className="space-y-3">
                        <Button className="w-full justify-start" variant="outline">
                          <Calendar className="w-4 h-4 mr-2" />
                          Schedule New Appointment
                        </Button>
                        <Button className="w-full justify-start" variant="outline">
                          <User className="w-4 h-4 mr-2" />
                          View Patient Directory
                        </Button>
                        <Button className="w-full justify-start" variant="outline">
                          <FileText className="w-4 h-4 mr-2" />
                          Review Past Encounters
                        </Button>
                        <Button className="w-full justify-start" variant="outline">
                          <Settings className="w-4 h-4 mr-2" />
                          Practice Settings
                        </Button>
                        <Button 
                          className="w-full justify-start" 
                          variant="outline"
                          onClick={handleResetOits}
                          disabled={isResetting}
                        >
                          <RefreshCw className={`w-4 h-4 mr-2 ${isResetting ? 'animate-spin' : ''}`} />
                          {isResetting ? 'Resetting...' : 'Reset OITs'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Self Preview + Chat/Journal (Always Visible) */}
        <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
          <MediaControls 
            onTrackToggle={(kind, enabled) => {
              livekitClient.toggleTrack(kind, enabled)
            }}
            onDeviceChange={async (kind, deviceId) => {
              await livekitClient.replaceTrack(kind, deviceId)
            }}
          />
          <ChatPanel 
            encounterId={activeEncounterId || ''}
            participantId="provider-demo-001"
          />
        </div>
      </div>
    </div>
  )
}
