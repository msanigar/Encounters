'use client'

import { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { formatTime, formatDate } from '@/lib/utils'
import { MessageSquare, FileText, Activity, Send, Filter } from 'lucide-react'

interface JournalProps {
  encounterId: string
}

type JournalFilter = 'all' | 'system' | 'chat' | 'forms'

export function Journal({ encounterId }: JournalProps) {
  const [filter, setFilter] = useState<JournalFilter>('all')
  const [message, setMessage] = useState('')
  
  const events = useQuery(api.queries.journal.list, { encounterId: encounterId as any, filter })
  const postMessage = useMutation(api.mutations.chat.postMessage)

  const handleSendMessage = async () => {
    if (!message.trim()) return

    try {
      await postMessage({
        encounterId: encounterId as any,
        text: message,
        participantId: 'provider-demo-001',
      })
      setMessage('')
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'CHAT_MESSAGE':
        return <MessageSquare className="w-4 h-4" />
      case 'FORM_ASSIGNED':
      case 'FORM_SUBMITTED':
        return <FileText className="w-4 h-4" />
      default:
        return <Activity className="w-4 h-4" />
    }
  }

  const getEventColor = (type: string) => {
    switch (type) {
      case 'CHAT_MESSAGE':
        return 'bg-blue-100 text-blue-800'
      case 'FORM_ASSIGNED':
      case 'FORM_SUBMITTED':
        return 'bg-green-100 text-green-800'
      case 'PROVIDER_JOINED':
      case 'MEDIA_STARTED':
        return 'bg-purple-100 text-purple-800'
      case 'PROVIDER_LEFT':
      case 'MEDIA_STOPPED':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Journal</h2>
          <Button size="sm" variant="outline">
            <Filter className="w-4 h-4" />
          </Button>
        </div>

        {/* Filter tabs */}
        <div className="flex space-x-1">
          {(['all', 'system', 'chat', 'forms'] as JournalFilter[]).map((tab) => (
            <Button
              key={tab}
              size="sm"
              variant={filter === tab ? 'default' : 'ghost'}
              onClick={() => setFilter(tab)}
              className="text-xs"
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Events list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {events?.slice().reverse().map((event) => (
          <div key={event._id} className="flex space-x-3">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="text-xs">
                {event.type === 'CHAT_MESSAGE' ? 'U' : 'S'}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <div className={getEventColor(event.type)}>
                  {getEventIcon(event.type)}
                </div>
                <Badge variant="outline" className="text-xs">
                  {event.type}
                </Badge>
                <span className="text-xs text-gray-500">
                  {new Date(event.at).toLocaleTimeString()}
                </span>
              </div>
              
              <div className="text-sm text-gray-900">
                {event.type === 'CHAT_MESSAGE' ? (
                  <div>
                    <span className="font-medium">
                      {event.payload.participantId === 'provider-demo-001' ? 'You' : 'Patient'}:
                    </span>{' '}
                    {event.payload.text}
                  </div>
                ) : event.type === 'FORM_ASSIGNED' ? (
                  <div>
                    Form <span className="font-medium">{event.payload.formId}</span> assigned
                  </div>
                ) : event.type === 'FORM_SUBMITTED' ? (
                  <div>
                    Form submitted with {Object.keys(event.payload).length} fields
                  </div>
                ) : event.type === 'PROVIDER_JOINED' ? (
                  <div>Provider joined the call</div>
                ) : event.type === 'PROVIDER_LEFT' ? (
                  <div>Provider left the call</div>
                ) : event.type === 'MEDIA_STARTED' ? (
                  <div>Video call started</div>
                ) : event.type === 'MEDIA_STOPPED' ? (
                  <div>Video call ended</div>
                ) : (
                  <div>{event.type}</div>
                )}
              </div>
            </div>
          </div>
        ))}

        {events?.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-sm">No events yet</p>
            <p className="text-xs">Activity will appear here</p>
          </div>
        )}
      </div>

      {/* Chat input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            className="flex-1"
          />
          <Button
            size="sm"
            onClick={handleSendMessage}
            disabled={!message.trim()}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
