import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface DeviceState {
  selectedMicId: string | null
  selectedCamId: string | null
  selectedSpeakerId: string | null
  micLevel: number
  camLevel: number
  speakerLevel: number
  lastGoodConstraints: {
    audio?: MediaTrackConstraints
    video?: MediaTrackConstraints
  }
  setSelectedMicId: (id: string | null) => void
  setSelectedCamId: (id: string | null) => void
  setSelectedSpeakerId: (id: string | null) => void
  setMicLevel: (level: number) => void
  setCamLevel: (level: number) => void
  setSpeakerLevel: (level: number) => void
  setLastGoodConstraints: (constraints: {
    audio?: MediaTrackConstraints
    video?: MediaTrackConstraints
  }) => void
}

export const useDeviceStore = create<DeviceState>()(
  persist(
    (set) => ({
      selectedMicId: null,
      selectedCamId: null,
      selectedSpeakerId: null,
      micLevel: 0,
      camLevel: 0,
      speakerLevel: 0,
      lastGoodConstraints: {},
      setSelectedMicId: (id) => set({ selectedMicId: id }),
      setSelectedCamId: (id) => set({ selectedCamId: id }),
      setSelectedSpeakerId: (id) => set({ selectedSpeakerId: id }),
      setMicLevel: (level) => set({ micLevel: level }),
      setCamLevel: (level) => set({ camLevel: level }),
      setSpeakerLevel: (level) => set({ speakerLevel: level }),
      setLastGoodConstraints: (constraints) => set({ lastGoodConstraints: constraints }),
    }),
    {
      name: 'device-store',
    }
  )
)
