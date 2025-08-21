'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useDeviceStore } from '@/stores/devices'
import { Mic, MicOff, Video, VideoOff, Volume2 } from 'lucide-react'

interface MediaControlsProps {
  onTrackToggle?: (kind: 'audio' | 'video', enabled: boolean) => void
  onDeviceChange?: (kind: 'audio' | 'video', deviceId: string) => void
}

export function MediaControls({ onTrackToggle, onDeviceChange }: MediaControlsProps = {}) {
  const [devices, setDevices] = useState<{
    audioInputs: MediaDeviceInfo[]
    videoInputs: MediaDeviceInfo[]
    audioOutputs: MediaDeviceInfo[]
  }>({
    audioInputs: [],
    videoInputs: [],
    audioOutputs: [],
  })
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [isMicEnabled, setIsMicEnabled] = useState(true)
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const videoRef = useRef<HTMLVideoElement>(null)

  const {
    selectedMicId,
    selectedCamId,
    selectedSpeakerId,
    setSelectedMicId,
    setSelectedCamId,
    setSelectedSpeakerId,
  } = useDeviceStore()

  useEffect(() => {
    const loadDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices()
        
        const audioInputs = devices.filter(device => device.kind === 'audioinput')
        const videoInputs = devices.filter(device => device.kind === 'videoinput')
        const audioOutputs = devices.filter(device => device.kind === 'audiooutput')
        
        setDevices({
          audioInputs,
          videoInputs,
          audioOutputs,
        })

        // Check for persisted device selections
        if (selectedMicId) {
          const micExists = audioInputs.some(d => d.deviceId === selectedMicId)
          if (!micExists) {
            setSelectedMicId(null)
          }
        }

        if (selectedCamId) {
          const camExists = videoInputs.some(d => d.deviceId === selectedCamId)
          if (!camExists) {
            setSelectedCamId(null)
          }
        }

        if (selectedSpeakerId) {
          const speakerExists = audioOutputs.some(d => d.deviceId === selectedSpeakerId)
          if (!speakerExists) {
            setSelectedSpeakerId(null)
          }
        }

        // Set default selections if none selected or if persisted devices not found
        if (!selectedMicId && audioInputs.length > 0) {
          setSelectedMicId(audioInputs[0].deviceId)
        }
        if (!selectedCamId && videoInputs.length > 0) {
          setSelectedCamId(videoInputs[0].deviceId)
        }
        if (!selectedSpeakerId && audioOutputs.length > 0) {
          setSelectedSpeakerId(audioOutputs[0].deviceId)
        }
      } catch (error) {
        console.error('Failed to load devices:', error)
      }
    }

    loadDevices()

    // Listen for device changes
    navigator.mediaDevices.addEventListener('devicechange', loadDevices)
    
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', loadDevices)
    }
  }, [selectedMicId, selectedCamId, selectedSpeakerId, setSelectedMicId, setSelectedCamId, setSelectedSpeakerId])

  // Get local video stream for preview
  useEffect(() => {
    const getLocalStream = async () => {
      try {
        if (!selectedCamId || !selectedMicId) return

        const constraints = {
          video: {
            deviceId: { exact: selectedCamId },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: {
            deviceId: { exact: selectedMicId },
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        }

        const stream = await navigator.mediaDevices.getUserMedia(constraints)
        
        console.log('MediaControls - Self preview stream created with devices:', {
          audioTrack: stream.getAudioTracks()[0]?.getSettings()?.deviceId,
          videoTrack: stream.getVideoTracks()[0]?.getSettings()?.deviceId,
          selectedMicId,
          selectedCamId
        })
        
        setLocalStream(stream)
      } catch (error) {
        console.error('Failed to get stream with selected devices, falling back to defaults:', error)
        
        // Fallback to default devices
        try {
          const fallbackStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          })
          
          setLocalStream(fallbackStream)
        } catch (fallbackError) {
          console.error('Failed to get fallback stream:', fallbackError)
        }
      }
    }

    getLocalStream()

    return () => {
      // Clean up old stream
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop())
      }
    }
  }, [selectedCamId, selectedMicId])

  // Update video element when stream changes
  useEffect(() => {
    if (localStream && videoRef.current) {
      videoRef.current.srcObject = localStream
    }
  }, [localStream])

  const toggleMic = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0]
      if (audioTrack) {
        const newMicEnabled = !isMicEnabled
        audioTrack.enabled = newMicEnabled
        setIsMicEnabled(newMicEnabled)
        onTrackToggle?.('audio', newMicEnabled)
      }
    }
  }

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0]
      if (videoTrack) {
        const newVideoEnabled = !isVideoEnabled
        videoTrack.enabled = newVideoEnabled
        setIsVideoEnabled(newVideoEnabled)
        onTrackToggle?.('video', newVideoEnabled)

        // Force video element reload if video was re-enabled
        if (newVideoEnabled && videoRef.current) {
          const currentSrcObject = videoRef.current.srcObject
          videoRef.current.srcObject = null
          videoRef.current.srcObject = currentSrcObject
          videoRef.current.load()
        }
      }
    }
  }

  const handleDeviceChange = (deviceType: 'mic' | 'cam' | 'speaker', deviceId: string) => {
    switch (deviceType) {
      case 'mic':
        setSelectedMicId(deviceId)
        onDeviceChange?.('audio', deviceId)
        break
      case 'cam':
        setSelectedCamId(deviceId)
        onDeviceChange?.('video', deviceId)
        break
      case 'speaker':
        setSelectedSpeakerId(deviceId)
        break
    }
  }

  return (
    <div className="p-4 border-b border-gray-200 bg-gray-50">
      <div className="space-y-4">
        {/* Self Preview - Responsive size */}
        <div className="relative w-full bg-gray-900 rounded-lg overflow-hidden flex-shrink-0" style={{ aspectRatio: '16/9' }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${localStream && isVideoEnabled ? 'block' : 'hidden'}`}
          />
          {(!localStream || !isVideoEnabled) && (
            <div className="w-full h-full flex items-center justify-center">
              <Video className="w-12 h-12 text-gray-400" />
            </div>
          )}
          {/* Video disabled overlay */}
          {localStream && !isVideoEnabled && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <VideoOff className="w-8 h-8 text-white" />
            </div>
          )}
          {/* Audio indicator */}
          <div className="absolute bottom-2 left-2">
            <div className={`w-4 h-4 rounded-full ${isMicEnabled ? 'bg-green-500' : 'bg-red-500'}`} />
          </div>
        </div>

        {/* Media Controls - Responsive layout */}
        <div className="space-y-3">
          {/* Microphone */}
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
            <Button
              size="sm"
              variant={isMicEnabled ? "default" : "secondary"}
              onClick={toggleMic}
              className="w-full sm:w-8 h-8 p-0"
            >
              {isMicEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            </Button>
            <Select value={selectedMicId || ''} onValueChange={(value) => handleDeviceChange('mic', value)}>
              <SelectTrigger className="flex-1 h-8 text-xs">
                <SelectValue placeholder="Microphone" />
              </SelectTrigger>
              <SelectContent>
                {devices.audioInputs
                  .filter((device) => device.deviceId && device.deviceId.trim() !== '')
                  .map((device) => (
                    <SelectItem key={device.deviceId} value={device.deviceId}>
                      {device.label || `Mic ${device.deviceId.slice(0, 8)}`}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Video */}
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
            <Button
              size="sm"
              variant={isVideoEnabled ? "default" : "secondary"}
              onClick={toggleVideo}
              className="w-full sm:w-8 h-8 p-0"
            >
              {isVideoEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
            </Button>
            <Select value={selectedCamId || ''} onValueChange={(value) => handleDeviceChange('cam', value)}>
              <SelectTrigger className="flex-1 h-8 text-xs">
                <SelectValue placeholder="Camera" />
              </SelectTrigger>
              <SelectContent>
                {devices.videoInputs
                  .filter((device) => device.deviceId && device.deviceId.trim() !== '')
                  .map((device) => (
                    <SelectItem key={device.deviceId} value={device.deviceId}>
                      {device.label || `Cam ${device.deviceId.slice(0, 8)}`}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Speaker */}
          <div className="flex items-center space-x-2">
            <Volume2 className="w-4 h-4 text-gray-600" />
            <Select value={selectedSpeakerId || ''} onValueChange={(value) => handleDeviceChange('speaker', value)}>
              <SelectTrigger className="flex-1 h-8 text-xs">
                <SelectValue placeholder="Speaker" />
              </SelectTrigger>
              <SelectContent>
                {devices.audioOutputs
                  .filter((device) => device.deviceId && device.deviceId.trim() !== '')
                  .map((device) => (
                    <SelectItem key={device.deviceId} value={device.deviceId}>
                      {device.label || `Speaker ${device.deviceId.slice(0, 8)}`}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  )
}
