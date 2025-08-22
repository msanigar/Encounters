'use client'

import { useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { 
  CheckCircle, 
  Clock, 
  FileText, 
  AlertCircle,
  Users,
  Calendar,
  Phone,
  Mail
} from 'lucide-react'

export default function CheckInPage() {
  const [formData, setFormData] = useState({
    displayName: '',
    reasonForVisit: '',
    contactInfo: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [checkInResult, setCheckInResult] = useState<any>(null)

  const checkIn = useMutation(api.mutations.queue.checkIn)

  const handleInputChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.displayName.trim()) {
      newErrors.displayName = 'Name is required'
    }
    
    if (!formData.reasonForVisit.trim()) {
      newErrors.reasonForVisit = 'Reason for visit is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      const result = await checkIn({
        providerId: 'provider-demo-001', // TODO: Make this dynamic
        providerRoom: 'demo-room',
        displayName: formData.displayName.trim(),
        reasonForVisit: formData.reasonForVisit.trim(),
        contactInfo: formData.contactInfo.trim() || undefined,
      })

      setCheckInResult(result)
    } catch (error) {
      console.error('Failed to check in:', error)
      alert('Failed to check in. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (checkInResult) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              You&apos;re Checked In!
            </CardTitle>
            <p className="text-gray-600 mt-2">
              Thank you for checking in
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-800">Queue Position:</span>
                <Badge variant="secondary" className="text-lg font-bold">
                  #{checkInResult.queuePosition}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-800">Estimated Wait:</span>
                <span className="text-sm text-blue-700 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {checkInResult.estimatedWaitTime} minutes
                </span>
              </div>
            </div>

            <div className="p-4 bg-yellow-50 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Please wait here.</strong> The provider will call you when it&apos;s your turn. 
                You&apos;ll receive a link to join the video call.
              </p>
            </div>

            <div className="text-center">
              <p className="text-xs text-gray-500">
                Keep this page open to see updates on your wait time.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Users className="w-8 h-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Walk-in Check-in
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Join the queue for a telehealth consultation
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                Full Name
                <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                placeholder="Enter your full name"
                value={formData.displayName}
                onChange={(e) => handleInputChange('displayName', e.target.value)}
                className={errors.displayName ? 'border-red-500' : ''}
              />
              {errors.displayName && (
                <div className="flex items-center gap-1 text-red-600 text-sm">
                  <AlertCircle className="w-3 h-3" />
                  {errors.displayName}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                Reason for Visit
                <span className="text-red-500">*</span>
              </label>
              <Textarea
                placeholder="Please describe why you'd like to see the provider today"
                value={formData.reasonForVisit}
                onChange={(e) => handleInputChange('reasonForVisit', e.target.value)}
                className={errors.reasonForVisit ? 'border-red-500' : ''}
                rows={3}
              />
              {errors.reasonForVisit && (
                <div className="flex items-center gap-1 text-red-600 text-sm">
                  <AlertCircle className="w-3 h-3" />
                  {errors.reasonForVisit}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Contact Information (Optional)
              </label>
              <Input
                type="text"
                placeholder="Email or phone number"
                value={formData.contactInfo}
                onChange={(e) => handleInputChange('contactInfo', e.target.value)}
              />
              <p className="text-xs text-gray-500">
                Providing contact info helps us follow up and maintain your records.
              </p>
            </div>

            <div className="pt-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full"
              >
                {isSubmitting ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Checking In...
                  </>
                ) : (
                  <>
                    <Calendar className="w-4 h-4 mr-2" />
                    Join Queue
                  </>
                )}
              </Button>
            </div>

            <div className="text-center pt-2">
              <p className="text-xs text-gray-500">
                By checking in, you agree to receive telehealth services.
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
