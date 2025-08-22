'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { EncounterList } from '@/components/LeftRail/EncounterList'
import { MediaCanvas } from '@/components/CenterStage/MediaCanvas'
import { WorkflowMode } from '@/components/CenterStage/WorkflowMode'
import { ChatPanel } from '@/components/ChatPanel/ChatPanel'
import { MediaControls } from '@/components/MediaControls/MediaControls'
import { PatientSelector } from '@/components/PatientSelector/PatientSelector'
import { ScheduleEncounter } from '@/components/ScheduleEncounter/ScheduleEncounter'
import { QueueManagement } from '@/components/QueueManagement/QueueManagement'
import { LogoutButton } from '@/components/LogoutButton'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { livekitClient } from '@/lib/livekitClient'

export default function ProviderDashboard() {
  const [activeEncounterId, setActiveEncounterId] = useState<string | null>(null)
  const [isInMedia, setIsInMedia] = useState(false)
  const [providerId, setProviderId] = useState<string | null>(null)
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null)
  const [selectedPatient, setSelectedPatient] = useState<any>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const activeEncounter = useQuery(api.queries.encounters.getWithDetails, 
    activeEncounterId ? { encounterId: activeEncounterId as any } : 'skip'
  )
  
  // Auto-tidy functionality
  const tidyStale = useMutation(api.mutations.encounter.tidyStale)
  const cleanupQueue = useMutation(api.mutations.queue.cleanupOldQueueEntries)
  const tidyIntervalRef = useRef<NodeJS.Timeout | null>(null)

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

  // Auto-tidy effect - run on dashboard load and every 60 seconds
  useEffect(() => {
    if (!providerId) return
    
    // Run initial tidy
    const runTidy = async () => {
      try {
        // Clean up stale encounters
        const result = await tidyStale({})
        if (result.tidiedCount > 0) {
          console.log(`🧹 Auto-tidied ${result.tidiedCount} stale encounters`)
        }
        
        // Clean up stale queue entries
        const queueResult = await cleanupQueue({ olderThanMinutes: 30 })
        if (queueResult.cleanedCount > 0) {
          console.log(`🧹 Auto-cleaned ${queueResult.cleanedCount} stale queue entries`)
        }
      } catch (error) {
        console.error('Failed to run auto-tidy:', error)
      }
    }
    
    runTidy()
    
    // Set up interval for periodic tidy
    tidyIntervalRef.current = setInterval(runTidy, 60 * 1000) // 60 seconds
    
    // Cleanup on unmount
    return () => {
      if (tidyIntervalRef.current) {
        clearInterval(tidyIntervalRef.current)
      }
    }
  }, [providerId, tidyStale, cleanupQueue])

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

  const handlePatientSelect = (patientId: string, patient: any) => {
    setSelectedPatientId(patientId || null)
    setSelectedPatient(patient)
  }

  if (!providerId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Sign in required</h2>
          <p className="text-gray-600 mb-4">Please sign in to access your provider dashboard.</p>
          <Button onClick={() => router.push('/provider/login')}>Go to Sign In</Button>
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
          <LogoutButton />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Left Panel - Encounters (Always Visible) */}
        <EncounterList
          providerId={providerId}
          onEncounterSelect={handleEncounterSelect}
          activeEncounterId={activeEncounterId || undefined}
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
                  
                  {/* Patient Management */}
                  <div className="space-y-6">
                    {/* Patient Selector */}
                    <PatientSelector 
                      onPatientSelect={handlePatientSelect}
                      selectedPatientId={selectedPatientId}
                    />

                    {/* Schedule Encounter - Only show when patient is selected */}
                    {selectedPatientId && selectedPatient && (
                      <ScheduleEncounter
                        selectedPatientId={selectedPatientId}
                        selectedPatient={selectedPatient}
                        providerId={providerId || 'provider-demo-001'}
                        providerRoom="demo-room"
                      />
                    )}

                    {/* Queue Management */}
                    <QueueManagement
                      providerId={providerId || 'provider-demo-001'}
                      onEncounterCreated={(encounterId) => {
                        setActiveEncounterId(encounterId)
                        setIsInMedia(false)
                        updateUrl(encounterId, false)
                      }}
                    />
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
