'use client'

import React, { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface DebugData {
  participants: string[]
  publishedTracks: string[]
  subscribedTracks: string[]
  remoteVideo: boolean
  localVideo: boolean
  debugInfo: string[]
  isConnected: boolean
}

interface DebugPanelProps {
  debugData: DebugData | null
  encounterId?: string
}

export function DebugPanel({ debugData, encounterId }: DebugPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!encounterId) {
    return null
  }

  return (
    <div className="border-t border-gray-200">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 text-left hover:bg-gray-50 transition-colors flex items-center justify-between"
      >
        <div>
          <h3 className="font-medium text-gray-900">Debug Info</h3>
          <p className="text-sm text-gray-500">
            {debugData?.isConnected ? 'Connected' : 'Disconnected'}
          </p>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>
      
      <div 
        className={`overflow-hidden transition-all duration-300 ${
          isExpanded ? 'max-h-96' : 'max-h-0'
        }`}
      >
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          {debugData ? (
            <div className="space-y-3 text-sm">
              <div>
                <span className="font-medium text-blue-600">Participants:</span>
                <div className="text-gray-700 ml-2">
                  {debugData.participants.length > 0 ? debugData.participants.join(', ') : 'None'}
                </div>
              </div>
              
              <div>
                <span className="font-medium text-green-600">Published:</span>
                <div className="text-gray-700 ml-2">
                  {debugData.publishedTracks.length > 0 ? debugData.publishedTracks.join(', ') : 'None'}
                </div>
              </div>
              
              <div>
                <span className="font-medium text-yellow-600">Subscribed:</span>
                <div className="text-gray-700 ml-2">
                  {debugData.subscribedTracks.length > 0 ? debugData.subscribedTracks.join(', ') : 'None'}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-medium text-purple-600">Remote Video:</span>
                  <div className="text-gray-700 ml-2">
                    {debugData.remoteVideo ? '✅ Yes' : '❌ No'}
                  </div>
                </div>
                <div>
                  <span className="font-medium text-cyan-600">Local Video:</span>
                  <div className="text-gray-700 ml-2">
                    {debugData.localVideo ? '✅ Yes' : '❌ No'}
                  </div>
                </div>
              </div>
              
              <div>
                <span className="font-medium text-gray-600">Recent Events:</span>
                <div className="mt-2 max-h-32 overflow-y-auto bg-white border border-gray-200 rounded p-2">
                  {debugData.debugInfo.length > 0 ? (
                    debugData.debugInfo.map((info, i) => (
                      <div key={i} className="text-xs text-gray-600 font-mono">
                        {info}
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-gray-400 italic">No events yet</div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-500 italic">
              No debug data available
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
