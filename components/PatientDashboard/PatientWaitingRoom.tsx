'use client'

import { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { 
  User, 
  Clock, 
  FileText, 
  Phone, 
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { formatTime } from '@/lib/utils'

interface PatientWaitingRoomProps {
  encounterId: string
  participantId: string
  displayName: string
  onJoinCall: () => void
}

export function PatientWaitingRoom({ 
  encounterId, 
  participantId, 
  displayName, 
  onJoinCall 
}: PatientWaitingRoomProps) {
  const [activeForm, setActiveForm] = useState<string | null>(null)
  const [formResponses, setFormResponses] = useState<Record<string, any>>({})

  const encounter = useQuery(api.queries.encounters.get, { encounterId: encounterId as any })
  const workflow = useQuery(api.queries.workflows.get, { encounterId: encounterId as any })
  const submitWorkflow = useMutation(api.mutations.workflow.submit)

  const handleFormSubmit = async (formId: string) => {
    try {
      await submitWorkflow({
        encounterId: encounterId as any,
        payload: {
          participantId,
          formId,
          responses: formResponses[formId] || {}
        }
      })
      setActiveForm(null)
      setFormResponses(prev => ({ ...prev, [formId]: {} }))
    } catch (error) {
      console.error('Failed to submit form:', error)
    }
  }

  const sampleForms = [
    {
      id: 'consent-form',
      title: 'Consent Form',
      description: 'Please review and sign the consent form',
      fields: [
        { id: 'consent', label: 'I consent to treatment', type: 'checkbox' },
        { id: 'emergency_contact', label: 'Emergency Contact', type: 'text' },
        { id: 'allergies', label: 'Allergies', type: 'textarea' }
      ]
    },
    {
      id: 'symptoms-form',
      title: 'Symptoms Checklist',
      description: 'Please describe your current symptoms',
      fields: [
        { id: 'primary_symptom', label: 'Primary Symptom', type: 'text' },
        { id: 'symptom_duration', label: 'How long?', type: 'text' },
        { id: 'severity', label: 'Severity (1-10)', type: 'number' },
        { id: 'additional_symptoms', label: 'Other symptoms', type: 'textarea' }
      ]
    }
  ]

  if (!encounter) {
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
              Preparing your waiting room
            </p>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="h-full bg-gray-50 p-6">
      {/* Main Content */}
      <div className="h-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Encounter Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Encounter Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Session Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <span className="font-medium text-gray-700">Provider:</span>
                  <span className="ml-2 text-gray-900">Dr. Smith</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Scheduled:</span>
                  <span className="ml-2 text-gray-900">
                    {encounter.scheduledAt ? formatTime(encounter.scheduledAt) : 'Not scheduled'}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Status:</span>
                  <Badge className="ml-2" variant={encounter.status === 'active' ? 'default' : 'secondary'}>
                    {encounter.status === 'active' ? 'In Progress' : 'Scheduled'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="w-4 h-4 mr-2" />
                  View Medical History
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Report Technical Issues
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Center Column - Forms */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Forms to Complete
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {sampleForms.map((form) => (
                  <div key={form.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-medium text-gray-900">{form.title}</h3>
                        <p className="text-sm text-gray-600">{form.description}</p>
                      </div>
                      <Button
                        size="sm"
                        variant={activeForm === form.id ? "default" : "outline"}
                        onClick={() => setActiveForm(activeForm === form.id ? null : form.id)}
                      >
                        {activeForm === form.id ? 'Close' : 'Open'}
                      </Button>
                    </div>
                    
                    {activeForm === form.id && (
                      <div className="space-y-3">
                        {form.fields.map((field) => (
                          <div key={field.id}>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {field.label}
                            </label>
                            {field.type === 'textarea' ? (
                              <Textarea
                                value={formResponses[form.id]?.[field.id] || ''}
                                onChange={(e) => setFormResponses(prev => ({
                                  ...prev,
                                  [form.id]: { ...prev[form.id], [field.id]: e.target.value }
                                }))}
                                placeholder={`Enter ${field.label.toLowerCase()}`}
                              />
                            ) : field.type === 'checkbox' ? (
                              <input
                                type="checkbox"
                                checked={formResponses[form.id]?.[field.id] || false}
                                onChange={(e) => setFormResponses(prev => ({
                                  ...prev,
                                  [form.id]: { ...prev[form.id], [field.id]: e.target.checked }
                                }))}
                                className="mr-2"
                              />
                            ) : (
                              <Input
                                type={field.type}
                                value={formResponses[form.id]?.[field.id] || ''}
                                onChange={(e) => setFormResponses(prev => ({
                                  ...prev,
                                  [form.id]: { ...prev[form.id], [field.id]: e.target.value }
                                }))}
                                placeholder={`Enter ${field.label.toLowerCase()}`}
                              />
                            )}
                          </div>
                        ))}
                        <Button
                          size="sm"
                          onClick={() => handleFormSubmit(form.id)}
                          className="w-full"
                        >
                          Submit Form
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>


        </div>
      </div>
    </div>
  )
}
