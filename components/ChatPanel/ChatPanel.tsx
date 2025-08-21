'use client'

import { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MessageSquare, Send } from 'lucide-react'

interface ChatPanelProps {
  encounterId: string
  participantId: string
}

export function ChatPanel({ encounterId, participantId }: ChatPanelProps) {
  const [message, setMessage] = useState('')
  
  const events = useQuery(
    api.queries.journal.list, 
    encounterId ? { encounterId: encounterId as any, filter: 'chat' } : 'skip'
  )
  const postMessage = useMutation(api.mutations.chat.postMessage)

  const handleSendMessage = async () => {
    if (!message.trim() || !encounterId) return

    try {
      await postMessage({
        encounterId: encounterId as any,
        participantId,
        text: message.trim(),
      })
      setMessage('')
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  const isProvider = participantId === 'provider-demo-001'

  // Show empty state when no encounter is selected
  if (!encounterId) {
    return (
      <>
        {/* Chat Header */}
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Chat</h2>
          <p className="text-sm text-gray-600">
            Select an encounter to start messaging
          </p>
        </div>

        {/* Empty State */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="text-center py-8 text-gray-500">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-sm">No encounter selected</p>
            <p className="text-xs">Choose an encounter from the left panel</p>
          </div>
        </div>

        {/* Disabled Chat Input */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex space-x-2">
            <Input
              value=""
              disabled
              placeholder="Select an encounter to chat..."
              className="flex-1"
            />
            <Button size="sm" disabled>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      {/* Chat Header - More compact */}
      <div className="p-3 border-b border-gray-200">
        <h2 className="text-base font-semibold text-gray-900">Chat</h2>
        <p className="text-xs text-gray-600">
          {isProvider ? 'Message your patient' : 'Message your provider'}
        </p>
      </div>

      {/* Chat Messages - Reduced padding */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {events && events.length > 0 ? (
          events.slice().reverse().map((event: any) => (
            <div
              key={event._id}
              className={`flex ${event.payload.participantId === participantId ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs px-3 py-2 rounded-lg ${
                  event.payload.participantId === participantId
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="text-sm">{event.payload.text}</p>
                <p className="text-xs opacity-70 mt-1">
                  {new Date(event.at).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-6 text-gray-500">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No messages yet</p>
            <p className="text-xs">Start a conversation</p>
          </div>
        )}
      </div>

      {/* Chat Input - More compact */}
      <div className="p-3 border-t border-gray-200">
        <div className="flex space-x-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            className="flex-1 h-8 text-sm"
          />
          <Button
            size="sm"
            onClick={handleSendMessage}
            disabled={!message.trim()}
            className="h-8 px-3"
          >
            <Send className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </>
  )
}
