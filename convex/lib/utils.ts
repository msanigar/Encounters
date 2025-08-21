import { Id } from '../_generated/dataModel'

export function generateOIT(): string {
  return `oit_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`
}

export function generateHOT(): string {
  return `hot_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`
}

export function generateDeviceNonce(): string {
  return `device_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`
}

export function hashRRT(rrt: string): string {
  // In production, use a proper hashing library
  return `hash_${rrt.substring(0, 8)}_${Date.now()}`
}

export function generateLiveKitRoomName(encounterId: Id<'encounters'>): string {
  return `encounter_${encounterId.replace('encounters_', '')}_${Date.now()}`
}

export function validateOIT(oit: string): boolean {
  return oit.startsWith('oit_') && oit.length > 20
}

export function validateHOT(hot: string): boolean {
  return hot.startsWith('hot_') && hot.length > 20
}

export function getRRTExpiryTime(): number {
  return Date.now() + 24 * 60 * 60 * 1000 // 24 hours from now
}

export function isRRTExpired(expiresAt: number): boolean {
  return Date.now() > expiresAt
}

export function getParticipants(encounterId: Id<'encounters'>) {
  console.log('🔍 getParticipants called with encounterId:', encounterId)
  // Implementation would go here
  return []
}

export function getPublishedTracks(encounterId: Id<'encounters'>) {
  console.log('🔍 getPublishedTracks called with encounterId:', encounterId)
  // Implementation would go here
  return []
}
