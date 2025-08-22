'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useConvex } from 'convex/react'
import { useAction, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { livekitClient } from '@/lib/livekitClient'
import { ConnectionState, RemoteParticipant, RemoteTrack, RemoteTrackPublication } from 'livekit-client'
import { useDeviceStore } from '@/stores/devices'

interface MediaCanvasProps {
  encounterId: string
  livekitRoom: string | null | undefined
  isProvider?: boolean
  onJoinMedia?: () => void
  onLeaveMedia?: () => void
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

export function MediaCanvas({ 
  encounterId, 
  livekitRoom, 
  isProvider = false,
  onJoinMedia,
  onLeaveMedia,
  onDebugUpdate
}: MediaCanvasProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [remoteVideo, setRemoteVideo] = useState<MediaStream | null>(null)
  const [localVideo, setLocalVideo] = useState<MediaStream | null>(null)
  const [debugInfo, setDebugInfo] = useState<string[]>([])
  const [participants, setParticipants] = useState<string[]>([])
  const [publishedTracks, setPublishedTracks] = useState<string[]>([])
  const [subscribedTracks, setSubscribedTracks] = useState<string[]>([])

  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  // const localVideoRef = useRef<HTMLVideoElement>(null) // REMOVED - no PiP needed for provider
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
  const generateToken = useAction(api.actions.livekit.generateToken)
  const { selectedMicId, selectedCamId } = useDeviceStore()
  const providerJoin = useMutation(api.mutations.provider.join)
  const providerLeave = useMutation(api.mutations.provider.leave)
  const providerHeartbeat = useMutation(api.mutations.provider.heartbeat)

  // Set up heartbeat interval when connected
  useEffect(() => {
    if (!isConnected || !encounterId) return

    const heartbeatInterval = setInterval(async () => {
      try {
        await providerHeartbeat({
          encounterId: encounterId as any,
          providerId: 'provider-demo-001',
        })
      } catch (error) {
        console.error('Failed to send heartbeat:', error)
      }
    }, 30000) // Send heartbeat every 30 seconds

    return () => clearInterval(heartbeatInterval)
  }, [isConnected, encounterId, providerHeartbeat])

  // Set up Convex client for LiveKit
  useEffect(() => {
    livekitClient.setClient(convex)
  }, [convex])

  const handleJoinMedia = useCallback(async () => {
    if (!livekitRoom || !encounterId || hasJoined.current) return

    try {
      setIsJoining(true)
      hasJoined.current = true

      // Update provider presence to online
      await providerJoin({
        encounterId: encounterId as any,
        providerId: 'provider-demo-001',
      })

      const tokenResult = await generateToken({
        roomName: livekitRoom,
        participantId: isProvider ? 'provider-demo-001' : 'patient-demo-001',
      })

      const token = tokenResult.token

      // Connect to LiveKit room
      const result = await livekitClient.preWarm({
        roomName: livekitRoom,
        token,
        encounterId,
        participantId: isProvider ? 'provider-demo-001' : `patient_${Date.now()}`,
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
          
          if (track.kind === 'video') {
            // Get the remote stream directly from the track
            const remoteStream = new MediaStream([track.mediaStreamTrack])
            console.log('Created remote video stream:', remoteStream)
            console.log('Remote track info:', {
              id: track.mediaStreamTrack.id,
              kind: track.mediaStreamTrack.kind,
              enabled: track.mediaStreamTrack.enabled,
              readyState: track.mediaStreamTrack.readyState
            })
            setRemoteVideo(remoteStream)
            addDebugInfo(`Remote video set from ${participant.identity}`)
          } else if (track.kind === 'audio') {
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
      onJoinMedia?.()
    } catch (error) {
      hasJoined.current = false
    } finally {
      setIsJoining(false)
    }
  }, [encounterId, livekitRoom, isProvider, generateToken, onJoinMedia])

  // Handle local video element - REMOVED for provider view since device controls show self-preview
  // useEffect(() => {
  //   const localStream = livekitClient.getLocalStream()
  //   const localVideoElement = localVideoRef.current
  //   if (localStream && localVideoElement) {
  //     console.log('Setting LOCAL video stream to PiP element, tracks:', localStream.getTracks().map(t => t.kind))
  //     console.log('Local video element:', localVideoElement)
  //     console.log('Local stream ID:', localStream.id)
  //     addDebugInfo(`Setting LOCAL video to PiP element (ID: ${localStream.id})`)
  //     setLocalVideo(localStream) // Update local video state
  //     try {
  //       // Clear any existing stream first
  //       localVideoElement.srcObject = null
  //       // Set the local stream
  //       localVideoElement.srcObject = localStream
  //       localVideoElement.play().catch(() => {
  //         // Silent fail for autoplay
  //       })
  //     } catch (error) {
  //       console.error('Error setting local video:', error)
  //       addDebugInfo(`Error setting local video: ${error}`)
  //     }
  //   }
  // }, [isPublishing])

  // Handle remote video element
  useEffect(() => {
    const videoElement = remoteVideoRef.current
    if (remoteVideo && videoElement) {
      try {
        videoElement.srcObject = remoteVideo
        videoElement.play().catch(() => {
          // Silent fail for autoplay
        })
      } catch (error) {
        // Silent fail
      }
    }
  }, [remoteVideo])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      hasJoined.current = false
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null
      }
      // if (localVideoRef.current) { // REMOVED - no PiP needed for provider
      //   localVideoRef.current.srcObject = null
      // }
    }
  }, [])

  // Auto-join when component mounts
  useEffect(() => {
    if (!hasJoined.current && livekitRoom && !isJoining) {
      handleJoinMedia()
    }
  }, [livekitRoom]) // Only depend on livekitRoom, not the entire handleJoinMedia function

  const handleLeaveMedia = useCallback(async () => {
    if (!encounterId) return

    try {
      // Update provider presence to offline
      await providerLeave({
        encounterId: encounterId as any,
        providerId: 'provider-demo-001',
      })

      // Disconnect from LiveKit
      await livekitClient.disconnect()
      
      hasJoined.current = false
      setIsConnected(false)
      setIsJoining(false)
      setIsPublishing(false)
      setLocalVideo(null)
      setRemoteVideo(null)
      setParticipants([])
      setPublishedTracks([])
      setSubscribedTracks([])
      
      onLeaveMedia?.()
    } catch (error) {
      console.error('Failed to leave media:', error)
    }
  }, [encounterId, providerLeave, onLeaveMedia])

  return (
    <div className="flex-1 flex flex-col bg-gray-900 relative">
      {/* Video Container */}
      <div className="flex-1 relative">
        {/* Remote Video */}
        <video
          ref={remoteVideoRef}
          className="w-full h-full object-cover bg-gray-800"
          autoPlay
          playsInline
          muted={false}
        />
        <div className="absolute top-1 left-1 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
          Patient
        </div>
        
        {/* Local Video (PiP) - REMOVED for provider view since device controls show self-preview */}

        {/* Connection Status */}
        <div className="absolute top-4 left-4">
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {isConnected ? 'Connected' : 'Connecting...'}
          </div>
        </div>

        {/* Debug Info Panel - MOVED to left panel */}

        {/* Loading Overlay */}
        {isJoining && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="text-white text-lg">Joining call...</div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-gray-800 p-4 flex items-center justify-center">
        <button
          onClick={handleLeaveMedia}
          className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          End Call
        </button>
      </div>
    </div>
  )
}
