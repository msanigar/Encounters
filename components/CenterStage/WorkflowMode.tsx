'use client'

import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Toast, useToast } from '@/components/ui/toast'
import { formatTime } from '@/lib/utils'
import { FileText, CheckCircle, Clock, User, Link, Copy } from 'lucide-react'

interface WorkflowModeProps {
  encounterId: string
  onJoinCall?: () => void
}

export function WorkflowMode({ encounterId, onJoinCall }: WorkflowModeProps) {
  const encounter = useQuery(api.queries.encounters.getWithDetails, { encounterId: encounterId as any })
  const workflow = useQuery(api.queries.workflows.get, { encounterId: encounterId as any })
  const assignWorkflow = useMutation(api.mutations.workflow.assign)
  const { toast, showToast, hideToast } = useToast()

  const handleAssignForm = async (formId: string) => {
    try {
      await assignWorkflow({ encounterId: encounterId as any, formIdStub: formId })
    } catch (error) {
      console.error('Failed to assign workflow:', error)
    }
  }

  const sampleForms = [
    { id: 'intake', title: 'Patient Intake Form', description: 'Basic patient information and medical history' },
    { id: 'symptoms', title: 'Symptom Assessment', description: 'Current symptoms and severity' },
    { id: 'medications', title: 'Medication Review', description: 'Current medications and allergies' },
  ]

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
              {sampleForms.map((form) => (
                <div
                  key={form.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{form.title}</h3>
                    <p className="text-sm text-gray-600">{form.description}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAssignForm(form.id)}
                  >
                    Assign
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Current Workflow */}
        {workflow && workflow.state !== 'none' && (
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
                    {workflow.items[workflow.items.length - 1]?.formId || 'Form'} Assigned
                  </p>
                  <p className="text-sm text-gray-600">
                    Status: {workflow.state}
                  </p>
                </div>
                <Badge
                  variant={workflow.state === 'submitted' ? 'default' : 'secondary'}
                >
                  {workflow.state === 'submitted' ? 'Completed' : 'In Progress'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="flex justify-center space-x-4">
          {/* Show Join Call button for providers OR when there's an active workflow */}
          {(workflow && workflow.state !== 'none') || encounter?.providerId ? (
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
          <Button size="lg" variant="outline">
            <FileText className="w-4 h-4 mr-2" />
            View Notes
          </Button>
        </div>
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
