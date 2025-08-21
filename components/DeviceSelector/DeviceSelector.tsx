'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Mic, Video, X } from 'lucide-react'

interface DeviceSelectorProps {
  isOpen: boolean
  onClose: () => void
  onDeviceChange: () => void
}

export function DeviceSelector({ isOpen, onClose, onDeviceChange }: DeviceSelectorProps) {
  const [devices, setDevices] = useState<{
    audioInputs: MediaDeviceInfo[]
    videoInputs: MediaDeviceInfo[]
    audioOutputs: MediaDeviceInfo[]
  }>({
    audioInputs: [],
    videoInputs: [],
    audioOutputs: [],
  })

  const [selectedDevices, setSelectedDevices] = useState({
    audioInput: '',
    videoInput: '',
    audioOutput: '',
  })

  useEffect(() => {
    if (isOpen) {
      loadDevices()
    }
  }, [isOpen])

  const loadDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      
      setDevices({
        audioInputs: devices.filter(device => device.kind === 'audioinput'),
        videoInputs: devices.filter(device => device.kind === 'videoinput'),
        audioOutputs: devices.filter(device => device.kind === 'audiooutput'),
      })

      // Set current selections
      const currentStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true })
      const audioTrack = currentStream.getAudioTracks()[0]
      const videoTrack = currentStream.getVideoTracks()[0]
      
      setSelectedDevices({
        audioInput: audioTrack?.getSettings().deviceId || '',
        videoInput: videoTrack?.getSettings().deviceId || '',
        audioOutput: '', // Browser doesn't provide current audio output
      })

      // Stop the temporary stream
      currentStream.getTracks().forEach(track => track.stop())
    } catch (error) {
      console.error('Failed to load devices:', error)
    }
  }

  const handleDeviceChange = async (deviceType: 'audioInput' | 'videoInput' | 'audioOutput', deviceId: string) => {
    setSelectedDevices(prev => ({ ...prev, [deviceType]: deviceId }))
    
    try {
      // Get new stream with selected devices
      const constraints: MediaStreamConstraints = {
        audio: deviceType === 'audioInput' ? { deviceId: { exact: deviceId } } : true,
        video: deviceType === 'videoInput' ? { deviceId: { exact: deviceId } } : true,
      }
      
      const newStream = await navigator.mediaDevices.getUserMedia(constraints)
      console.log('📹 Got new stream with selected device:', deviceType, deviceId)
      
      // Call the parent's device change handler
      onDeviceChange()
      
    } catch (error) {
      console.error('Failed to switch device:', error)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md">
        <CardHeader className="flex items-center justify-between">
          <CardTitle className="text-lg">Device Settings</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Microphone Selection */}
          <div>
            <label className="flex items-center space-x-2 text-sm font-medium mb-2">
              <Mic className="w-4 h-4" />
              <span>Microphone</span>
            </label>
            <Select
              value={selectedDevices.audioInput}
              onValueChange={(value) => handleDeviceChange('audioInput', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select microphone" />
              </SelectTrigger>
              <SelectContent>
                {devices.audioInputs.map((device) => (
                  <SelectItem key={device.deviceId} value={device.deviceId}>
                    {device.label || `Microphone ${device.deviceId.slice(0, 8)}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Camera Selection */}
          <div>
            <label className="flex items-center space-x-2 text-sm font-medium mb-2">
              <Video className="w-4 h-4" />
              <span>Camera</span>
            </label>
            <Select
              value={selectedDevices.videoInput}
              onValueChange={(value) => handleDeviceChange('videoInput', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select camera" />
              </SelectTrigger>
              <SelectContent>
                {devices.videoInputs.map((device) => (
                  <SelectItem key={device.deviceId} value={device.deviceId}>
                    {device.label || `Camera ${device.deviceId.slice(0, 8)}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Speaker Selection (if supported) */}
          {devices.audioOutputs.length > 0 && (
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium mb-2">
                <Mic className="w-4 h-4" />
                <span>Speaker</span>
              </label>
              <Select
                value={selectedDevices.audioOutput}
                onValueChange={(value) => handleDeviceChange('audioOutput', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select speaker" />
                </SelectTrigger>
                <SelectContent>
                  {devices.audioOutputs.map((device) => (
                    <SelectItem key={device.deviceId} value={device.deviceId}>
                      {device.label || `Speaker ${device.deviceId.slice(0, 8)}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={onClose}>
              Done
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
