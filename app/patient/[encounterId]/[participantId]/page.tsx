'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { PatientDashboard } from '@/components/PatientDashboard/PatientDashboard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { User } from 'lucide-react'

export default function PatientPage() {
  const params = useParams()
  const encounterId = params.encounterId as string
  const participantId = params.participantId as string
  
  const [displayName, setDisplayName] = useState<string>('')
  const [isReady, setIsReady] = useState(false)

  const encounter = useQuery(api.queries.encounters.getWithDetails, { encounterId: encounterId as any })

  useEffect(() => {
    // Get participant info from localStorage (set during check-in)
    const storedName = localStorage.getItem(`patient_${participantId}_name`)
    if (storedName) {
      setDisplayName(storedName)
      setIsReady(true)
    }
  }, [participantId])

  if (!isReady || !encounter) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <User className="w-8 h-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Loading...
            </CardTitle>
            <p className="text-gray-600 mt-2">
              Preparing your telehealth session
            </p>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div>
      <PatientDashboard
        encounterId={encounterId}
        participantId={participantId}
        displayName={displayName}
      />
    </div>
  )
}
