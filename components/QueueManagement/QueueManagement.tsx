'use client'

import { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Toast, useToast } from '@/components/ui/toast'
import { formatTime } from '@/lib/utils'
import { 
  Users, 
  Clock, 
  UserPlus, 
  MessageSquare, 
  Mail, 
  Phone,
  Copy
} from 'lucide-react'

interface QueueManagementProps {
  providerId: string
  providerRoom: string
}

export function QueueManagement({ providerId, providerRoom }: QueueManagementProps) {
  const [isConverting, setIsConverting] = useState<string | null>(null)
  const { toast, showToast, hideToast } = useToast()

  const queue = useQuery(api.queries.queue.getQueue, { providerId })
  const convertToEncounter = useMutation(api.mutations.queue.convertToEncounter)

  const handleStartEncounter = async (visitId: string) => {
    setIsConverting(visitId)
    try {
      await convertToEncounter({ visitId: visitId as any })
    } catch (error) {
      console.error('Failed to convert visit to encounter:', error)
    } finally {
      setIsConverting(null)
    }
  }

  const waitingCount = queue?.length || 0

  return (
    <div className="space-y-6">
      {/* Queue Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5" />
            Queue Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 mb-4">
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{waitingCount}</div>
              <div className="text-sm text-yellow-700">Waiting</div>
            </div>
          </div>

          {/* Queue List */}
          <div className="space-y-3">
            {queue && queue.length > 0 ? (
              queue.map((visit: any) => (
                <div
                  key={visit._id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge variant="outline" className="text-xs">
                        #{visit.queuePosition}
                      </Badge>
                      <h4 className="font-medium text-gray-900">{visit.displayName}</h4>
                      {visit.contactInfo && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          {visit.contactInfo.includes('@') ? (
                            <Mail className="w-3 h-3" />
                          ) : (
                            <Phone className="w-3 h-3" />
                          )}
                          <span>{visit.contactInfo}</span>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{visit.reasonForVisit}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Checked in {formatTime(visit.checkedInAt)}</span>
                      </div>
                      {visit.estimatedWaitTime && (
                        <div className="flex items-center gap-1">
                          <span>Est. {visit.estimatedWaitTime}m wait</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleStartEncounter(visit._id)}
                      disabled={isConverting === visit._id}
                      className="flex items-center gap-2"
                    >
                      {isConverting === visit._id ? (
                        <>
                          <Clock className="w-4 h-4 animate-spin" />
                          Starting...
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4" />
                          Start Encounter
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-sm">No patients in queue</p>
                <p className="text-xs">Patients will appear here when they check in</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Check-in Link */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Walk-in Check-in
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Share this link with walk-in patients to join the queue:
            </p>
            <div className="flex gap-2">
              <div className="flex-1 p-2 bg-gray-100 rounded text-sm font-mono break-all">
                {typeof window !== 'undefined' ? `${window.location.origin}/checkin` : '/checkin'}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    navigator.clipboard.writeText(`${window.location.origin}/checkin`)
                    showToast('Walk-in check-in link copied to clipboard!')
                  }
                }}
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Toast Notification */}
      <Toast
        message={toast.message}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
    </div>
  )
}
