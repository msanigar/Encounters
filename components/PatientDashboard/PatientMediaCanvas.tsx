'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useConvex } from 'convex/react'
import { livekitClient } from '@/lib/livekitClient'
import { ConnectionState, RemoteParticipant, RemoteTrack, RemoteTrackPublication } from 'livekit-client'
import { useDeviceStore } from '@/stores/devices'

interface PatientMediaCanvasProps {
  encounterId: string
  livekitRoom: string | null | undefined
  participantId: string
  displayName: string
  onLeaveCall?: () => void
  onJoinCall?: () => void
  onDebugUpdate?: (debugData: {
    participants: string[]
    publishedTracks: string[]
    subscribedTracks: string[]
    remoteVideo: boolean
    localVideo: boolean
    debugInfo: string[]
    isConnected: boolean
  }) => void
}

export function PatientMediaCanvas({ 
  encounterId, 
  livekitRoom, 
  participantId,
  displayName,
  onLeaveCall,
  onJoinCall,
  onDebugUpdate
}: PatientMediaCanvasProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [localVideo, setLocalVideo] = useState<MediaStream | null>(null)
  const [remoteVideo, setRemoteVideo] = useState<MediaStream | null>(null)
  const [debugInfo, setDebugInfo] = useState<string[]>([])
  const [participants, setParticipants] = useState<string[]>([])
  const [publishedTracks, setPublishedTracks] = useState<string[]>([])
  const [subscribedTracks, setSubscribedTracks] = useState<string[]>([])
  const [remoteTracks, setRemoteTracks] = useState<{ [participantId: string]: { audio?: MediaStreamTrack, video?: MediaStreamTrack } }>({})

  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const hasJoined = useRef(false)

  const addDebugInfo = (info: string) => {
    setDebugInfo(prev => [...prev.slice(-9), `${new Date().toLocaleTimeString()}: ${info}`])
  }

  // Send debug updates to parent component
  useEffect(() => {
    onDebugUpdate?.({
      participants,
      publishedTracks,
      subscribedTracks,
      remoteVideo: !!remoteVideo,
      localVideo: !!localVideo,
      debugInfo,
      isConnected
    })
  }, [participants, publishedTracks, subscribedTracks, remoteVideo, localVideo, debugInfo, isConnected, onDebugUpdate])

  const convex = useConvex()
  const { selectedMicId, selectedCamId } = useDeviceStore()

  const handleJoinCall = useCallback(async () => {
    if (!livekitRoom || !encounterId || !participantId || hasJoined.current) return

    hasJoined.current = true
    livekitClient.setClient(convex)

    try {
      const storedToken = localStorage.getItem(`livekit_token_${participantId}`)
      if (!storedToken) {
        throw new Error('No LiveKit token found. Please check in again.')
      }

      // Connect to LiveKit room
      const result = await livekitClient.preWarm({
        roomName: livekitRoom,
        token: storedToken,
        encounterId,
        participantId: participantId,
        selectedMicId,
        selectedCamId,
        onConnectionStateChanged: (state: ConnectionState) => {
          console.log('Connection state changed:', state)
          addDebugInfo(`Connection: ${state}`)
          setIsConnected(state === ConnectionState.Connected)
        },
        onParticipantConnected: (participant: RemoteParticipant) => {
          console.log('Participant connected:', participant.identity)
          addDebugInfo(`Participant joined: ${participant.identity}`)
          setParticipants(prev => {
            const newParticipants = [...prev, participant.identity]
            console.log('Updated participants:', newParticipants)
            return newParticipants
          })
        },
        onParticipantDisconnected: (participant: RemoteParticipant) => {
          console.log('Participant disconnected:', participant.identity)
          addDebugInfo(`Participant left: ${participant.identity}`)
          setParticipants(prev => prev.filter(p => p !== participant.identity))
          
          // Clean up tracks for this participant
          setRemoteTracks(prev => {
            const { [participant.identity]: removed, ...remaining } = prev
            console.log('Cleaned up tracks for participant:', participant.identity)
            return remaining
          })
          
          // Clear remote video if no participants left
          setParticipants(prev => {
            if (prev.length === 0) {
              setRemoteVideo(null)
              addDebugInfo('No participants left, cleared remote video')
            }
            return prev
          })
        },
        onTrackSubscribed: (track: RemoteTrack, publication: RemoteTrackPublication, participant: RemoteParticipant) => {
          console.log('Track subscribed:', track.kind, 'from participant:', participant.identity)
          console.log('Remote track device info:', {
            id: track.mediaStreamTrack.id,
            kind: track.mediaStreamTrack.kind,
            enabled: track.mediaStreamTrack.enabled,
            readyState: track.mediaStreamTrack.readyState,
            deviceId: track.mediaStreamTrack.getSettings()?.deviceId,
            label: track.mediaStreamTrack.label
          })
          addDebugInfo(`Track subscribed: ${track.kind} from ${participant.identity}`)
          setSubscribedTracks(prev => [...prev, `${participant.identity}-${track.kind}`])
          
          // Accumulate tracks for this participant
          setRemoteTracks(prev => {
            const participantTracks = prev[participant.identity] || {}
            const updatedTracks = {
              ...prev,
              [participant.identity]: {
                ...participantTracks,
                [track.kind]: track.mediaStreamTrack
              }
            }
            
            // Create combined stream with all tracks from this participant
            const tracks = Object.values(updatedTracks[participant.identity])
            if (tracks.length > 0) {
              const combinedStream = new MediaStream(tracks)
              console.log('Created combined remote stream:', combinedStream, 'with tracks:', tracks.map(t => ({ kind: t.kind, id: t.id })))
              setRemoteVideo(combinedStream)
              addDebugInfo(`Combined stream set from ${participant.identity} with ${tracks.length} tracks`)
            }
            
            return updatedTracks
          })
          
          if (track.kind === 'audio') {
            // Handle audio track - create audio element and play
            const audioElement = new Audio()
            audioElement.srcObject = new MediaStream([track.mediaStreamTrack])
            audioElement.autoplay = true
            audioElement.play().catch(console.error)
            addDebugInfo(`Audio element created for ${participant.identity}`)
          }
        },
      })

      // Wait for connection to stabilize before publishing media
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      addDebugInfo('Publishing local tracks...')
      await livekitClient.joinMedia(true, true)
      setIsPublishing(true)
      setPublishedTracks(['audio', 'video'])
      addDebugInfo('Local tracks published')
      onJoinCall?.()
    } catch (error) {
      hasJoined.current = false
    }
  }, [livekitRoom, encounterId, participantId, convex, onJoinCall])

  // Handle local video element - REMOVED - now using MediaControls panel

  // Handle remote video element
  useEffect(() => {
    const videoElement = remoteVideoRef.current
    if (remoteVideo && videoElement) {
      console.log('Setting REMOTE video stream to main element, tracks:', remoteVideo.getTracks().map(t => t.kind))
      console.log('Remote video element (should be main):', videoElement)
      console.log('Remote video element ID:', videoElement.id)
      console.log('Remote video element class:', videoElement.className)
      console.log('Remote video stream ID:', remoteVideo.id)
      addDebugInfo(`Setting REMOTE video to main element (ID: ${remoteVideo.id})`)
      try {
        // Clear any existing stream first
        videoElement.srcObject = null
        // Set the remote stream
        videoElement.srcObject = remoteVideo
        videoElement.play().catch(() => {
          // Silent fail for autoplay
        })
        
        // Verify what's actually set
        setTimeout(() => {
          console.log('VERIFICATION - Main video element srcObject after setting remote:', videoElement.srcObject)
          console.log('VERIFICATION - Main video element tracks:', (videoElement.srcObject as MediaStream)?.getTracks().map((t: MediaStreamTrack) => ({ kind: t.kind, id: t.id })))
        }, 100)
      } catch (error) {
        console.error('Error setting remote video:', error)
        addDebugInfo(`Error setting remote video: ${error}`)
      }
    } else {
      console.log('No remote video or element available')
      addDebugInfo('No remote video available')
    }
  }, [remoteVideo])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      hasJoined.current = false
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null
      }
    }
  }, [])

  // Auto-join when component mounts
  useEffect(() => {
    if (!hasJoined.current && livekitRoom && !isJoining) {
      handleJoinCall()
    }
  }, [livekitRoom, handleJoinCall, isJoining]) // Only depend on livekitRoom, not the entire handleJoinCall function

  const handleLeaveCall = async () => {
    try {
      livekitClient.disconnect()
      setIsConnected(false)
      setLocalVideo(null)
      setRemoteVideo(null)
      setIsPublishing(false)
      hasJoined.current = false
      onLeaveCall?.()
    } catch (error) {
      // Silent fail
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-900 relative">
      {/* Video Container */}
      <div className="flex-1 relative">
        {/* Remote Video (Provider) */}
        <video
          ref={remoteVideoRef}
          id="patient-remote-video"
          className="w-full h-full object-cover bg-gray-800"
          autoPlay
          playsInline
          muted={false}
        />
        <div className="absolute top-1 left-1 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
          Provider
        </div>
        
        {/* Local Video (PiP) - REMOVED - now using MediaControls panel */}

        {/* Connection Status */}
        <div className="absolute top-2 sm:top-4 left-2 sm:left-4">
          <div className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${
            isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {isConnected ? 'Connected' : 'Connecting...'}
          </div>
        </div>

        {/* Debug Info Panel - MOVED to left panel */}

        {/* Loading Overlay */}
        {isJoining && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="text-white text-base sm:text-lg">Joining call...</div>
          </div>
        )}

        {/* Waiting for Provider */}
        {!remoteVideo && isConnected && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="text-white text-center px-4">
              <div className="text-base sm:text-lg mb-2">Waiting for provider to join...</div>
              <div className="text-xs sm:text-sm text-gray-300">Please wait while we connect you</div>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-gray-800 p-4 flex items-center justify-center">
        <button
          onClick={handleLeaveCall}
          className="w-full sm:w-auto px-6 py-3 sm:py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-base sm:text-sm"
        >
          End Call
        </button>
      </div>
    </div>
  )
}
