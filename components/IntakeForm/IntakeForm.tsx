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
  Send
} from 'lucide-react'
import { IntakeSchema, INTAKE_FORM_FIELDS, type IntakeFormData } from '@/lib/schemas/intakeSchema'

interface IntakeFormProps {
  encounterId: string
  patientId?: string
  onSubmit?: (data: IntakeFormData) => void
  className?: string
}

export function IntakeForm({ 
  encounterId, 
  patientId,
  onSubmit,
  className = '' 
}: IntakeFormProps) {
  const [formData, setFormData] = useState<Partial<IntakeFormData>>({
    shareWithProvider: true,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const submitForm = useMutation(api.mutations.forms.submitForm)

  const handleInputChange = (name: keyof IntakeFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate form
    const result = IntakeSchema.safeParse(formData)
    if (!result.success) {
      const newErrors: Record<string, string> = {}
      result.error.errors.forEach(error => {
        if (error.path[0]) {
          newErrors[error.path[0] as string] = error.message
        }
      })
      setErrors(newErrors)
      return
    }

    setIsSubmitting(true)
    try {
      await submitForm({
        encounterId: encounterId as any,
        patientId: patientId as any,
        formId: 'intake',
        answers: result.data,
      })

      setIsSubmitted(true)
      onSubmit?.(result.data)
    } catch (error) {
      console.error('Failed to submit form:', error)
      alert('Failed to submit form. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2 text-green-700">
            <CheckCircle className="w-5 h-5" />
            Form Submitted Successfully!
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-green-800">
              Thank you for completing the intake form. Your information has been shared with your healthcare provider.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Patient Intake Form
        </CardTitle>
        <p className="text-sm text-gray-600">
          Please complete this form before your appointment begins.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {INTAKE_FORM_FIELDS.map((field) => (
            <div key={field.name} className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                {field.label}
                {field.required && <span className="text-red-500">*</span>}
              </label>
              
              {field.type === 'text' && (
                <Input
                  type="text"
                  placeholder={field.placeholder}
                  value={formData[field.name] as string || ''}
                  onChange={(e) => handleInputChange(field.name, e.target.value)}
                  className={errors[field.name] ? 'border-red-500' : ''}
                />
              )}
              
              {field.type === 'date' && (
                <Input
                  type="date"
                  value={formData[field.name] as string || ''}
                  onChange={(e) => handleInputChange(field.name, e.target.value)}
                  className={errors[field.name] ? 'border-red-500' : ''}
                />
              )}
              
              {field.type === 'textarea' && (
                <Textarea
                  placeholder={field.placeholder}
                  value={formData[field.name] as string || ''}
                  onChange={(e) => handleInputChange(field.name, e.target.value)}
                  className={errors[field.name] ? 'border-red-500' : ''}
                  rows={3}
                />
              )}
              
              {field.type === 'checkbox' && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={field.name}
                    checked={formData[field.name] as boolean || false}
                    onChange={(e) => handleInputChange(field.name, e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor={field.name} className="text-sm text-gray-700">
                    {field.label}
                  </label>
                </div>
              )}
              
              {errors[field.name] && (
                <div className="flex items-center gap-1 text-red-600 text-sm">
                  <AlertCircle className="w-3 h-3" />
                  {errors[field.name]}
                </div>
              )}
            </div>
          ))}

          <div className="pt-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full"
            >
              {isSubmitting ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit Form
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
