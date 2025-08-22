'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarView } from '@/components/Calendar/CalendarView'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function CalendarPage() {
  const [providerId] = useState('provider-demo-001') // TODO: Get from auth
  const router = useRouter()

  const handleEncounterSelect = (encounterId: string) => {
    router.push(`/provider/dashboard?encounter=${encounterId}`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/provider/dashboard">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
                <p className="text-gray-600">View and manage your scheduled encounters</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4">
        <CalendarView 
          providerId={providerId}
        />
      </div>
    </div>
  )
}
