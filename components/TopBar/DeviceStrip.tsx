'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useDeviceStore } from '@/stores/devices'
import { Mic, MicOff, Video, VideoOff, Volume2, Settings } from 'lucide-react'

export function DeviceStrip() {
  const [devices, setDevices] = useState<{
    audioInputs: MediaDeviceInfo[]
    videoInputs: MediaDeviceInfo[]
    audioOutputs: MediaDeviceInfo[]
  }>({
    audioInputs: [],
    videoInputs: [],
    audioOutputs: [],
  })

  const {
    selectedMicId,
    selectedCamId,
    selectedSpeakerId,
    micLevel,
    camLevel,
    speakerLevel,
    setSelectedMicId,
    setSelectedCamId,
    setSelectedSpeakerId,
    setMicLevel,
    setCamLevel,
    setSpeakerLevel,
  } = useDeviceStore()

  useEffect(() => {
    const loadDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices()
        
        setDevices({
          audioInputs: devices.filter(device => device.kind === 'audioinput'),
          videoInputs: devices.filter(device => device.kind === 'videoinput'),
          audioOutputs: devices.filter(device => device.kind === 'audiooutput'),
        })

        // Set default selections if none selected
        if (!selectedMicId && devices.filter(d => d.kind === 'audioinput').length > 0) {
          setSelectedMicId(devices.filter(d => d.kind === 'audioinput')[0].deviceId)
        }
        if (!selectedCamId && devices.filter(d => d.kind === 'videoinput').length > 0) {
          setSelectedCamId(devices.filter(d => d.kind === 'videoinput')[0].deviceId)
        }
        if (!selectedSpeakerId && devices.filter(d => d.kind === 'audiooutput').length > 0) {
          setSelectedSpeakerId(devices.filter(d => d.kind === 'audiooutput')[0].deviceId)
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

  // Simulate device levels (in real app, these would come from actual device monitoring)
  useEffect(() => {
    const interval = setInterval(() => {
      setMicLevel(Math.random() * 100)
      setCamLevel(Math.random() * 100)
      setSpeakerLevel(Math.random() * 100)
    }, 100)

    return () => clearInterval(interval)
  }, [setMicLevel, setCamLevel, setSpeakerLevel])

  return (
    <div className="flex items-center space-x-4">
      {/* Provider info */}
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-medium">
          DP
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">Dr. Demo Provider</p>
          <p className="text-xs text-gray-500">Online</p>
        </div>
      </div>

      {/* Device controls */}
      <div className="flex items-center space-x-4">
        {/* Microphone */}
        <div className="flex items-center space-x-2">
          <Mic className="w-4 h-4 text-gray-600" />
          <Select value={selectedMicId || ''} onValueChange={setSelectedMicId}>
            <SelectTrigger className="w-32 h-8">
              <SelectValue placeholder="Mic" />
            </SelectTrigger>
            <SelectContent>
              {devices.audioInputs.map((device) => (
                <SelectItem key={device.deviceId} value={device.deviceId}>
                  {device.label || `Microphone ${device.deviceId.slice(0, 8)}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-500 transition-all duration-100"
              style={{ width: `${micLevel}%` }}
            />
          </div>
        </div>

        {/* Camera */}
        <div className="flex items-center space-x-2">
          <Video className="w-4 h-4 text-gray-600" />
          <Select value={selectedCamId || ''} onValueChange={setSelectedCamId}>
            <SelectTrigger className="w-32 h-8">
              <SelectValue placeholder="Camera" />
            </SelectTrigger>
            <SelectContent>
              {devices.videoInputs.map((device) => (
                <SelectItem key={device.deviceId} value={device.deviceId}>
                  {device.label || `Camera ${device.deviceId.slice(0, 8)}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-100"
              style={{ width: `${camLevel}%` }}
            />
          </div>
        </div>

        {/* Speaker */}
        <div className="flex items-center space-x-2">
          <Volume2 className="w-4 h-4 text-gray-600" />
          <Select value={selectedSpeakerId || ''} onValueChange={setSelectedSpeakerId}>
            <SelectTrigger className="w-32 h-8">
              <SelectValue placeholder="Speaker" />
            </SelectTrigger>
            <SelectContent>
              {devices.audioOutputs.map((device) => (
                <SelectItem key={device.deviceId} value={device.deviceId}>
                  {device.label || `Speaker ${device.deviceId.slice(0, 8)}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-purple-500 transition-all duration-100"
              style={{ width: `${speakerLevel}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
