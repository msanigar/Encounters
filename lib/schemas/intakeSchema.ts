import { z } from 'zod'

export const IntakeSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  dateOfBirth: z.string().optional(),
  reasonForVisit: z.string().min(1, 'Reason for visit is required'),
  consentToTreat: z.boolean().refine(val => val === true, {
    message: 'Consent to treat is required'
  }),
  shareWithProvider: z.boolean().default(true),
})

export type IntakeFormData = z.infer<typeof IntakeSchema>

export const INTAKE_FORM_FIELDS = [
  {
    name: 'fullName' as const,
    label: 'Full Name',
    type: 'text' as const,
    required: true,
    placeholder: 'Enter your full name',
  },
  {
    name: 'dateOfBirth' as const,
    label: 'Date of Birth',
    type: 'date' as const,
    required: false,
    placeholder: '',
  },
  {
    name: 'reasonForVisit' as const,
    label: 'Reason for Visit',
    type: 'textarea' as const,
    required: true,
    placeholder: 'Please describe the reason for your visit today',
  },
  {
    name: 'consentToTreat' as const,
    label: 'I consent to receive treatment from this healthcare provider',
    type: 'checkbox' as const,
    required: true,
    placeholder: '',
  },
  {
    name: 'shareWithProvider' as const,
    label: 'I consent to share this information with my healthcare provider',
    type: 'checkbox' as const,
    required: false,
    placeholder: '',
  },
] as const
