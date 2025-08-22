'use client'

import { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  Clock, 
  CheckCircle, 
  UserPlus,
  ArrowRight,
  Phone,
  Mail,
  MessageSquare
} from 'lucide-react'
import { formatTime } from '@/lib/utils'

interface QueueManagementProps {
  providerId: string
  onEncounterCreated?: (encounterId: string) => void
  className?: string
}

export function QueueManagement({ 
  providerId, 
  onEncounterCreated,
  className = '' 
}: QueueManagementProps) {
  const [isConverting, setIsConverting] = useState<string | null>(null)

  const queue = useQuery(api.queries.queue.getQueue, { providerId })
  const queueStats = useQuery(api.queries.queue.getQueueStats, { providerId })
  const convertToEncounter = useMutation(api.mutations.queue.convertToEncounter)

  const handleStartEncounter = async (visitId: string) => {
    setIsConverting(visitId)
    try {
      const result = await convertToEncounter({ visitId: visitId as any })
      onEncounterCreated?.(result.encounterId)
    } catch (error) {
      console.error('Failed to start encounter:', error)
      alert('Failed to start encounter. Please try again.')
    } finally {
      setIsConverting(null)
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Combined Queue Management */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Walk-in Queue
            </span>
            <Badge variant="secondary">
              {queue?.length || 0} waiting
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Queue Stats */}
          {queueStats ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{queueStats.waiting}</div>
                <div className="text-sm text-gray-600">Waiting</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{queueStats.inProgress}</div>
                <div className="text-sm text-gray-600">In Progress</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{queueStats.completedToday}</div>
                <div className="text-sm text-gray-600">Completed Today</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {Math.round(queueStats.averageWaitTime)}m
                </div>
                <div className="text-sm text-gray-600">Avg Wait</div>
              </div>
            </div>
          ) : (
            <div className="animate-pulse">
              <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="text-center">
                    <div className="h-8 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Queue List */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Current Patients
            </h4>
            {!queue ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-20 bg-gray-200 rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : queue.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-sm">No patients in queue</p>
                <p className="text-xs">Walk-in patients will appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {queue.map((visit: any) => (
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
                ))}
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
                    alert('Link copied to clipboard!')
                  }
                }}
              >
                Copy
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
