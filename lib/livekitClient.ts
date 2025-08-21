import { Room, RoomEvent, RemoteParticipant, RemoteTrack, RemoteTrackPublication, ConnectionState, createLocalTracks, LocalTrack } from 'livekit-client'
import { ConvexReactClient } from 'convex/react'

// Import device store to get selected devices
import { useDeviceStore } from '@/stores/devices'

// Global Convex client instance
let convexClient: ConvexReactClient | null = null

export interface LiveKitClientConfig {
  roomName: string
  token: string
  encounterId: string
  participantId: string
  selectedMicId?: string | null
  selectedCamId?: string | null
  onConnectionStateChanged?: (state: ConnectionState) => void
  onParticipantConnected?: (participant: RemoteParticipant) => void
  onTrackSubscribed?: (track: RemoteTrack, publication: RemoteTrackPublication, participant: RemoteParticipant) => void
}

export class LiveKitClient {
  private room: Room | null = null
  private localTracks: LocalTrack[] = []
  private isConnecting: boolean = false
  private currentRoomName: string | null = null
  private currentEncounterId: string | null = null
  private currentParticipantId: string | null = null
  private publishedTracks: Set<string> = new Set() // Track what's already published

  setClient(client: ConvexReactClient) {
    convexClient = client
  }

  async preWarm(config: LiveKitClientConfig): Promise<any> {
    if (this.isConnecting) {
      return { connected: false, fallback: false }
    }

    this.isConnecting = true
    this.currentRoomName = config.roomName
    this.currentEncounterId = config.encounterId
    this.currentParticipantId = config.participantId

    try {
      // Create local tracks using LiveKit's optimized method with selected devices
      const audioConstraints = {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        ...(config.selectedMicId && { deviceId: { exact: config.selectedMicId } }),
      }
      
      const videoConstraints = {
        resolution: {
          width: 1280,
          height: 720,
          frameRate: 30,
        },
        ...(config.selectedCamId && { deviceId: { exact: config.selectedCamId } }),
      }
      
      console.log('Creating local tracks with constraints:', {
        audio: audioConstraints,
        video: videoConstraints,
        selectedMicId: config.selectedMicId,
        selectedCamId: config.selectedCamId
      })
      
      this.localTracks = await createLocalTracks({
        audio: audioConstraints,
        video: videoConstraints,
      })

      console.log('Created local tracks:', this.localTracks.map(t => ({ 
        kind: t.kind, 
        id: t.mediaStreamTrack?.id,
        label: t.mediaStreamTrack?.label,
        deviceId: t.mediaStreamTrack?.getSettings()?.deviceId
      })))

      // Create LiveKit room with optimized configuration
      this.room = new Room({
        adaptiveStream: true,
        dynacast: true,
        stopLocalTrackOnUnpublish: false,
        publishDefaults: {
          simulcast: true,
        },
        // Disable silence detection to prevent false positives
        audioCaptureDefaults: {
          autoGainControl: true,
          echoCancellation: true,
          noiseSuppression: true,
        }
      })

      // Set up essential event listeners only
      this.room.on(RoomEvent.ParticipantConnected, (participant: RemoteParticipant) => {
        config.onParticipantConnected?.(participant)
      })

      this.room.on(RoomEvent.TrackSubscribed, (track: RemoteTrack, publication: RemoteTrackPublication, participant: RemoteParticipant) => {
        config.onTrackSubscribed?.(track, publication, participant)
      })

      this.room.on(RoomEvent.ConnectionStateChanged, (state: ConnectionState) => {
        config.onConnectionStateChanged?.(state)
      })

      // Connect to LiveKit room with proper serverUrl
      const serverUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL || 'wss://encounters-zfsea02u.livekit.cloud'
      await this.room.connect(serverUrl, config.token, {
        autoSubscribe: true,
      })

      this.isConnecting = false
      return { connected: true, fallback: false }
    } catch (error) {
      this.isConnecting = false
      throw error
    }
  }

  async joinMedia(publishAudio: boolean, publishVideo: boolean): Promise<void> {
    if (!this.room || this.room.state !== ConnectionState.Connected) {
      return
    }

    if (this.localTracks.length === 0) {
      throw new Error('No local tracks available')
    }

    try {
      console.log('Publishing tracks - localTracks:', this.localTracks.map(t => ({ kind: t.kind, id: t.mediaStreamTrack?.id })))
      
      // Filter tracks based on what we want to publish
      const tracksToPublish = this.localTracks.filter(track => {
        if (track.kind === 'audio' && publishAudio && !this.publishedTracks.has('audio')) return true
        if (track.kind === 'video' && publishVideo && !this.publishedTracks.has('video')) return true
        return false
      })

      console.log('Tracks to publish:', tracksToPublish.map(t => ({ kind: t.kind, id: t.mediaStreamTrack?.id })))

      // Publish tracks individually using LiveKit's method
      for (const track of tracksToPublish) {
        console.log('Publishing track:', { kind: track.kind, id: track.mediaStreamTrack?.id })
        await this.room.localParticipant.publishTrack(track)
        this.publishedTracks.add(track.kind)
        console.log('Successfully published track:', track.kind)
      }
    } catch (error) {
      console.error('Error publishing tracks:', error)
      throw error
    }
  }



  async leaveMedia(): Promise<void> {
    if (this.room) {
      // Disconnect from room
      await this.room.disconnect()
      this.room = null
    }

    // Stop local tracks
    this.localTracks.forEach(track => track.stop())
    this.localTracks = []
    this.publishedTracks.clear() // Reset published tracks

    this.currentRoomName = null
    this.currentEncounterId = null
    this.currentParticipantId = null
  }

  async disconnect(): Promise<void> {
    await this.leaveMedia()
  }

  getLocalStream(): MediaStream | null {
    // Create a MediaStream from local tracks for compatibility
    if (this.localTracks.length === 0) return null
    
    const stream = new MediaStream()
    this.localTracks.forEach(track => {
      if (track.mediaStreamTrack) {
        stream.addTrack(track.mediaStreamTrack)
      }
    })
    return stream
  }

  isConnected(): boolean {
    return this.room?.state === ConnectionState.Connected
  }

  getRoom(): Room | null {
    return this.room
  }

  toggleTrack(kind: 'audio' | 'video', enabled: boolean): void {
    const track = this.localTracks.find(t => t.kind === kind)
    if (track && track.mediaStreamTrack) {
      track.mediaStreamTrack.enabled = enabled
      console.log(`Toggled ${kind} track:`, enabled)
    }
  }

  async replaceTrack(kind: 'audio' | 'video', deviceId: string): Promise<void> {
    if (!this.room || this.room.state !== ConnectionState.Connected) {
      return
    }

    try {
      console.log(`Replacing ${kind} track with device:`, deviceId)
      
      // Create new track with the selected device
      const constraints = kind === 'audio' 
        ? { audio: { deviceId: { exact: deviceId } } }
        : { video: { deviceId: { exact: deviceId } } }
      
      const newTracks = await createLocalTracks(constraints)
      const newTrack = newTracks.find(t => t.kind === kind)
      
      if (!newTrack) {
        console.error(`Failed to create new ${kind} track`)
        return
      }

      // Find and unpublish old track
      const oldTrack = this.localTracks.find(t => t.kind === kind)
      if (oldTrack && this.publishedTracks.has(kind)) {
        await this.room.localParticipant.unpublishTrack(oldTrack)
        console.log(`Unpublished old ${kind} track`)
      }

      // Stop old track
      if (oldTrack) {
        oldTrack.stop()
        this.localTracks = this.localTracks.filter(t => t.kind !== kind)
      }

      // Add new track to local tracks
      this.localTracks.push(newTrack)

      // Publish new track if it was previously published
      if (this.publishedTracks.has(kind)) {
        await this.room.localParticipant.publishTrack(newTrack)
        console.log(`Published new ${kind} track`)
      }

      console.log(`Successfully replaced ${kind} track`)
    } catch (error) {
      console.error(`Error replacing ${kind} track:`, error)
      throw error
    }
  }
}

// Export singleton instance
export const livekitClient = new LiveKitClient()
