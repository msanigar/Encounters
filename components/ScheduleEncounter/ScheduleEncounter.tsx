'use client'

import { useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Calendar, 
  Clock, 
  Mail, 
  Link as LinkIcon, 
  MessageSquare,
  CheckCircle,
  Copy,
  ExternalLink
} from 'lucide-react'
import { formatTime } from '@/lib/utils'
import { useToast, Toast } from '@/components/ui/toast'

interface ScheduleEncounterProps {
  selectedPatientId?: string | null
  selectedPatient?: any
  providerId: string
  providerRoom: string
  className?: string
}

export function ScheduleEncounter({ 
  selectedPatientId, 
  selectedPatient,
  providerId,
  providerRoom,
  className = '' 
}: ScheduleEncounterProps) {
  const [scheduledTime, setScheduledTime] = useState(() => {
    // Default to next hour with minutes set to 00
    const now = new Date()
    now.setHours(now.getHours() + 1, 0, 0, 0) // Next hour, minutes=00, seconds=00, ms=00
    return now.toISOString().slice(0, 16) // Format for datetime-local input
  })
  const [channel, setChannel] = useState<'email' | 'sms' | 'link'>('email')
  const [isScheduling, setIsScheduling] = useState(false)
  const [scheduledEncounter, setScheduledEncounter] = useState<any>(null)
  const [copiedUrl, setCopiedUrl] = useState(false)
  const { toast, showToast, hideToast } = useToast()

  const createEncounterWithInvite = useMutation(api.mutations.scheduling.createEncounterWithInvite)

  const handleSchedule = async () => {
    if (!selectedPatientId || !selectedPatient) {
      alert('Please select a patient first')
      return
    }

    setIsScheduling(true)
    try {
      const when = new Date(scheduledTime).getTime()
      
      const result = await createEncounterWithInvite({
        providerId,
        providerRoom,
        when,
        patientId: selectedPatientId as any,
        patientProps: {
          displayName: selectedPatient.displayName,
          emailOrPhone: selectedPatient.emailOrPhone,
        },
        channel,
      })

      setScheduledEncounter(result)
    } catch (error) {
      console.error('Failed to schedule encounter:', error)
      alert('Failed to schedule encounter. Please try again.')
    } finally {
      setIsScheduling(false)
    }
  }

  const copyInviteUrl = async () => {
    if (scheduledEncounter) {
      const fullUrl = `${window.location.origin}${scheduledEncounter.inviteUrl}`
      await navigator.clipboard.writeText(fullUrl)
      showToast('Invite link copied to clipboard!')
    }
  }

  const openInviteUrl = () => {
    if (scheduledEncounter) {
      const fullUrl = `${window.location.origin}${scheduledEncounter.inviteUrl}`
      window.open(fullUrl, '_blank')
    }
  }

  const resetForm = () => {
    setScheduledEncounter(null)
    const now = new Date()
    now.setMinutes(now.getMinutes() + 15)
    setScheduledTime(now.toISOString().slice(0, 16))
    setChannel('email')
  }

  if (scheduledEncounter) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2 text-green-700">
            <CheckCircle className="w-5 h-5" />
            Encounter Scheduled!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-green-50 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-green-800">Patient:</span>
              <span className="text-sm text-green-700">{scheduledEncounter.patient?.displayName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-green-800">Scheduled:</span>
              <span className="text-sm text-green-700">{formatTime(new Date(scheduledTime))}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-green-800">Channel:</span>
              <Badge variant="secondary" className="text-xs">
                {channel === 'email' && <Mail className="w-3 h-3 mr-1" />}
                {channel === 'sms' && <MessageSquare className="w-3 h-3 mr-1" />}
                {channel === 'link' && <LinkIcon className="w-3 h-3 mr-1" />}
                {channel.toUpperCase()}
              </Badge>
            </div>
          </div>

          {channel === 'email' && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                ✅ Invite email sent to {scheduledEncounter.patient?.emailOrPhone}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">One-Time Invite Link:</p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={copyInviteUrl}
                className="flex-1"
              >
                <Copy className="w-4 h-4 mr-2" />
                {copiedUrl ? 'Copied!' : 'Copy Link'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={openInviteUrl}
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-gray-500 break-all">
              {window.location.origin}{scheduledEncounter.inviteUrl}
            </p>
          </div>

          <Button
            variant="outline"
            onClick={resetForm}
            className="w-full"
          >
            Schedule Another
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Schedule Encounter
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!selectedPatient ? (
          <div className="p-4 bg-yellow-50 rounded-lg">
            <p className="text-sm text-yellow-800">
              Please select a patient above to schedule an encounter.
            </p>
          </div>
        ) : (
          <>
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-blue-800">Patient:</span>
                <span className="text-sm text-blue-700">{selectedPatient.displayName}</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm font-medium text-blue-800">Contact:</span>
                <span className="text-sm text-blue-700">{selectedPatient.emailOrPhone}</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Scheduled Time
              </label>
              <Input
                type="datetime-local"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Invite Channel
              </label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={channel === 'email' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setChannel('email')}
                  className="flex items-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  Email
                </Button>
                <Button
                  variant={channel === 'sms' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setChannel('sms')}
                  className="flex items-center gap-2"
                  disabled // SMS not implemented yet
                >
                  <MessageSquare className="w-4 h-4" />
                  SMS
                </Button>
                <Button
                  variant={channel === 'link' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setChannel('link')}
                  className="flex items-center gap-2"
                >
                  <LinkIcon className="w-4 h-4" />
                  Link Only
                </Button>
              </div>
            </div>

            <Button
              onClick={handleSchedule}
              disabled={isScheduling || !selectedPatient}
              className="w-full"
            >
              {isScheduling ? 'Scheduling...' : 'Schedule Encounter'}
            </Button>
          </>
        )}
      </CardContent>
      
      {/* Toast Notification */}
      <Toast
        message={toast.message}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
    </Card>
  )
}
