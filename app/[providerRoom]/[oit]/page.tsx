'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useMutation, useAction } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { generateDeviceNonce } from '@/lib/utils'
import { User, Video, Mic, CheckCircle, Clock } from 'lucide-react'

export default function PatientCheckIn() {
  const params = useParams()
  const providerRoom = params.providerRoom as string
  const oit = params.oit as string
  
  const [displayName, setDisplayName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isCheckedIn, setIsCheckedIn] = useState(false)
  const [deviceNonce] = useState(() => generateDeviceNonce())

  const redeemInvite = useMutation(api.mutations.invites.redeem)
  const generateLiveKitToken = useAction(api.actions.livekit.generateToken)

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!displayName.trim()) return

    setIsLoading(true)
    setError('')

    try {
      const result = await redeemInvite({
        providerRoom,
        oit,
        deviceNonce,
        displayName: displayName.trim(),
      })

      // Generate LiveKit token
      const tokenResult = await generateLiveKitToken({
        roomName: result.livekitRoom,
        participantId: result.participantId,
      })

      // Store LiveKit token
      localStorage.setItem(`livekit_token_${result.participantId}`, tokenResult.token)

      // Set RRT cookie (in real app, this would be httpOnly)
      document.cookie = `rrt=${result.rrt}; path=/; max-age=${24 * 60 * 60}; samesite=lax`

      // Store participant info for the dashboard
      localStorage.setItem(`patient_${result.participantId}_name`, displayName.trim())

      setIsCheckedIn(true)
      
      // Redirect to patient dashboard
      setTimeout(() => {
        window.location.href = `/patient/${result.encounterId}/${result.participantId}`
      }, 2000)
    } catch (error) {
      setError('Failed to check in. Please try again.')
      console.error('Check-in error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isCheckedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Check-in Complete!
            </CardTitle>
            <p className="text-gray-600 mt-2">
              You&apos;re all set. The provider will join shortly.
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                <User className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900">Name</p>
                  <p className="text-sm text-blue-700">{displayName}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                <Video className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-900">Video Call</p>
                  <p className="text-sm text-green-700">Ready to connect</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                <Clock className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="font-medium text-purple-900">Status</p>
                  <p className="text-sm text-purple-700">Waiting for provider</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-4">
            <User className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Welcome to Your Appointment
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Please check in to begin your telehealth session
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCheckIn} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Your Name
              </label>
              <Input
                id="name"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your full name"
                required
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Checking in...' : 'Check In'}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-blue-50 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>What happens next?</strong><br />
              1. Complete your check-in<br />
              2. Wait for the provider to join<br />
              3. Start your video consultation
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
