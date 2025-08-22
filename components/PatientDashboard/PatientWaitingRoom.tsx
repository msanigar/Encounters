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
  Send
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
  const submitForm = useMutation(api.mutations.forms.submitForm)
  
  // Get form assignments for this encounter
  const formAssignments = useQuery(api.queries.forms.getAssignments, { encounterId: encounterId as any })

  const handleFormSubmit = async (formId: string) => {
    try {
      await submitForm({
        encounterId: encounterId as any,
        formId,
        answers: formResponses[formId] || {}
      })
      setActiveForm(null)
      setFormResponses(prev => ({ ...prev, [formId]: {} }))
    } catch (error) {
      console.error('Failed to submit form:', error)
    }
  }

  // Only show Intake form if it's assigned
  const assignedForms = formAssignments?.filter(assignment => assignment.formId === 'intake') || []
  
  // Intake form definition
  const intakeForm = {
    id: 'intake',
    title: 'Patient Intake Form',
    description: 'Please complete this form before your appointment begins',
    fields: [
      { id: 'fullName', label: 'Full Name', type: 'text', required: true },
      { id: 'dateOfBirth', label: 'Date of Birth', type: 'date', required: true },
      { id: 'phoneNumber', label: 'Phone Number', type: 'text', required: true },
      { id: 'emergencyContact', label: 'Emergency Contact', type: 'text' },
      { id: 'allergies', label: 'Allergies', type: 'textarea' },
      { id: 'currentMedications', label: 'Current Medications', type: 'textarea' },
      { id: 'medicalHistory', label: 'Medical History', type: 'textarea' },
      { id: 'reasonForVisit', label: 'Reason for Visit', type: 'textarea', required: true },
      { id: 'symptoms', label: 'Current Symptoms', type: 'textarea' },
      { id: 'shareWithProvider', label: 'I consent to share this information with my healthcare provider', type: 'checkbox', required: true }
    ]
  }

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
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Forms Section */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Forms to Complete
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {assignedForms.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-sm">No forms assigned yet</p>
                    <p className="text-xs">Your provider will assign forms when ready</p>
                  </div>
                ) : (
                  assignedForms.map((assignment) => {
                    const form = intakeForm // Only intake form for now
                    const isCompleted = assignment.status === 'complete'
                    
                    return (
                      <div key={assignment._id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="font-medium text-gray-900">{form.title}</h3>
                            <p className="text-sm text-gray-600">{form.description}</p>
                            <Badge 
                              variant={isCompleted ? "default" : "secondary"}
                              className="mt-1"
                            >
                              {isCompleted ? 'Completed' : 'Incomplete'}
                            </Badge>
                          </div>
                          {!isCompleted && (
                            <Button
                              size="sm"
                              variant={activeForm === form.id ? "default" : "outline"}
                              onClick={() => setActiveForm(activeForm === form.id ? null : form.id)}
                            >
                              {activeForm === form.id ? 'Close' : 'Open'}
                            </Button>
                          )}
                        </div>
                        
                        {activeForm === form.id && !isCompleted && (
                          <div className="space-y-3">
                            {form.fields.map((field) => (
                              <div key={field.id}>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  {field.label}
                                  {field.required && <span className="text-red-500 ml-1">*</span>}
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
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={formResponses[form.id]?.[field.id] || false}
                                      onChange={(e) => setFormResponses(prev => ({
                                        ...prev,
                                        [form.id]: { ...prev[form.id], [field.id]: e.target.checked }
                                      }))}
                                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <label className="text-sm text-gray-700">{field.label}</label>
                                  </div>
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
                              <Send className="w-4 h-4 mr-2" />
                              Submit Form
                            </Button>
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
