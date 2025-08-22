'use client'

import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Toast, useToast } from '@/components/ui/toast'
import { formatTime } from '@/lib/utils'
import { FileText, CheckCircle, Clock, User, Link, Copy } from 'lucide-react'
import { NotesPanel } from '@/components/NotesPanel/NotesPanel'

interface WorkflowModeProps {
  encounterId: string
  onJoinCall?: () => void
}

export function WorkflowMode({ encounterId, onJoinCall }: WorkflowModeProps) {
  const encounter = useQuery(api.queries.encounters.getWithDetails, { encounterId: encounterId as any })
  const formAssignments = useQuery(api.queries.forms.getAssignments, { encounterId: encounterId as any })
  const assignForm = useMutation(api.mutations.forms.assignForm)
  const { toast, showToast, hideToast } = useToast()

  const handleAssignForm = async (formId: string) => {
    try {
      await assignForm({ encounterId: encounterId as any, formId })
      showToast('Form assigned successfully!')
    } catch (error) {
      console.error('Failed to assign form:', error)
      showToast('Failed to assign form. Please try again.')
    }
  }

  const availableForms = [
    { id: 'intake', title: 'Patient Intake Form', description: 'Basic patient information and medical history' },
  ]

  // Check if intake form is assigned
  const intakeAssignment = formAssignments?.find(assignment => assignment.formId === 'intake')

  return (
    <div className="flex-1 bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Patient Waiting Room
          </h1>
          <p className="text-gray-600">
            Patient is ready for their appointment. You can assign forms or join the call when ready.
          </p>
        </div>

        {/* Patient Info */}
        {encounter && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="w-5 h-5 mr-2" />
                Patient Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Name:</span>
                  <span className="ml-2 text-gray-900">
                    {encounter.patientHint?.value || 'Not provided'}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Status:</span>
                  <Badge className="ml-2" variant="secondary">
                    Waiting
                  </Badge>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Scheduled:</span>
                  <span className="ml-2 text-gray-900">
                    {encounter.scheduledAt ? formatTime(new Date(encounter.scheduledAt)) : 'Not scheduled'}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Created:</span>
                  <span className="ml-2 text-gray-900">
                    {formatTime(new Date(encounter.createdAt))}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Invite Links */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Link className="w-5 h-5 mr-2" />
              Invite Links
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {encounter?.invites && encounter.invites.length > 0 ? (
                encounter.invites.map((invite: any) => (
                  <div key={invite._id} className="flex items-center justify-between p-3 border rounded-lg bg-blue-50">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">Patient Check-in Link</h3>
                      <p className="text-sm text-gray-600">
                        {invite.redeemedAt ? 'Already used' : 'Share this link with your patient to check in'}
                      </p>
                      <code className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded mt-1 block">
                        {`${window.location.origin}/${encounter?.providerRoom}/${invite.oit}`}
                      </code>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!!invite.redeemedAt}
                      onClick={() => {
                        const inviteUrl = `${window.location.origin}/${encounter?.providerRoom}/${invite.oit}`
                        navigator.clipboard.writeText(inviteUrl)
                        showToast('Invite link copied to clipboard!')
                      }}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      {invite.redeemedAt ? 'Used' : 'Copy'}
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <p>No invite links available</p>
                </div>
              )}
              
              <div className="text-xs text-gray-500">
                💡 <strong>Tip:</strong> Click the link icon (🔗) next to any encounter in the left panel to quickly copy its invite link.
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Available Forms */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Available Forms
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {availableForms.map((form: any) => {
                const isAssigned = formAssignments?.some(assignment => assignment.formId === form.id)
                const assignment = formAssignments?.find(assignment => assignment.formId === form.id)
                
                return (
                  <div
                    key={form.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{form.title}</h3>
                      <p className="text-sm text-gray-600">{form.description}</p>
                      {isAssigned && (
                        <div className="mt-2">
                          <Badge 
                            variant={assignment?.status === 'complete' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {assignment?.status === 'complete' ? 'Completed' : 'Assigned'}
                          </Badge>
                        </div>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant={isAssigned ? "outline" : "default"}
                      disabled={isAssigned}
                      onClick={() => handleAssignForm(form.id)}
                    >
                      {isAssigned ? 'Assigned' : 'Assign'}
                    </Button>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Current Workflow - Updated to use form assignments */}
        {intakeAssignment && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle className="w-5 h-5 mr-2" />
                Current Workflow
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">
                    Patient Intake Form Assigned
                  </p>
                  <p className="text-sm text-gray-600">
                    Status: {intakeAssignment.status}
                  </p>
                </div>
                <Badge
                  variant={intakeAssignment.status === 'complete' ? 'default' : 'secondary'}
                >
                  {intakeAssignment.status === 'complete' ? 'Completed' : 'In Progress'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="flex justify-center space-x-4">
          {/* Show Join Call button for providers OR when there's an assigned form */}
          {intakeAssignment || encounter?.providerId ? (
            <Button 
              size="lg" 
              className="bg-primary hover:bg-primary/90"
              onClick={() => {
                onJoinCall?.()
              }}
            >
              <Clock className="w-4 h-4 mr-2" />
              Join Call
            </Button>
          ) : null}
        </div>

        {/* Notes Panel */}
        <NotesPanel
          encounterId={encounterId}
          patientId={undefined} // Will be fetched from patient_links table
          providerId="provider-demo-001"
        />
      </div>

      {/* Toast Notification */}
      <Toast
        message={toast.message}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
    </div>
  )
}
