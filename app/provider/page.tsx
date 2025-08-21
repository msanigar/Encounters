'use client'

import { useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Calendar, 
  Clock, 
  User, 
  Plus,
  Video,
  Phone
} from 'lucide-react'
import { formatTime } from '@/lib/utils'
import Link from 'next/link'

export default function ProviderMainDashboard() {
  const [activeTab, setActiveTab] = useState<'today' | 'upcoming' | 'past'>('today')
  
  const encounters = useQuery(api.queries.encounters.listForProviderWithInvites, { 
    providerId: 'provider-demo-001' 
  })

  const todayEncounters = encounters?.filter(e => {
    const scheduled = new Date(e.scheduledAt || 0)
    const today = new Date()
    return scheduled.toDateString() === today.toDateString()
  }) || []

  const upcomingEncounters = encounters?.filter(e => {
    const scheduled = new Date(e.scheduledAt || 0)
    const today = new Date()
    return scheduled > today && scheduled.toDateString() !== today.toDateString()
  }) || []

  const pastEncounters = encounters?.filter(e => {
    const scheduled = new Date(e.scheduledAt || 0)
    const today = new Date()
    return scheduled < today
  }) || []

  const getEncountersForTab = () => {
    switch (activeTab) {
      case 'today': return todayEncounters
      case 'upcoming': return upcomingEncounters
      case 'past': return pastEncounters
      default: return []
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Provider Dashboard</h1>
              <p className="text-gray-600 mt-1">Manage your telehealth encounters</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse" />
                <span>Online</span>
              </div>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Schedule New
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Quick Stats */}
          <div className="lg:col-span-1 space-y-6">
            {/* Today's Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Today&apos;s Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Scheduled</span>
                  <Badge variant="secondary">{todayEncounters.length}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Completed</span>
                  <Badge variant="default">{pastEncounters.filter(e => {
                    const scheduled = new Date(e.scheduledAt || 0)
                    const today = new Date()
                    return scheduled.toDateString() === today.toDateString()
                  }).length}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Waiting</span>
                  <Badge variant="outline">{todayEncounters.filter(e => e.status === 'scheduled').length}</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="w-4 h-4 mr-2" />
                  View Calendar
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <User className="w-4 h-4 mr-2" />
                  Patient Directory
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Video className="w-4 h-4 mr-2" />
                  Test Call
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Center Column - Encounters */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Encounters</CardTitle>
                  <div className="flex space-x-1">
                    <Button
                      variant={activeTab === 'today' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setActiveTab('today')}
                    >
                      Today
                    </Button>
                    <Button
                      variant={activeTab === 'upcoming' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setActiveTab('upcoming')}
                    >
                      Upcoming
                    </Button>
                    <Button
                      variant={activeTab === 'past' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setActiveTab('past')}
                    >
                      Past
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {getEncountersForTab().length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">No encounters</p>
                    <p className="text-sm">No encounters found for this time period</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {getEncountersForTab().map((encounter) => (
                      <div
                        key={encounter._id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {encounter.patientHint?.value || 'Unknown Patient'}
                            </p>
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <Clock className="w-4 h-4" />
                              <span>
                                {encounter.scheduledAt ? formatTime(encounter.scheduledAt) : 'Not scheduled'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={encounter.status === 'active' ? 'default' : 'secondary'}>
                            {encounter.status === 'active' ? 'In Progress' : 'Scheduled'}
                          </Badge>
                          <Link href={`/provider/dashboard/${encounter._id}`}>
                            <Button size="sm" variant="outline">
                              <Phone className="w-4 h-4 mr-1" />
                              Join
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
