'use client'

import { useState } from 'react'
import { useAction } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function TestEmailPage() {
  const [email, setEmail] = useState('')
  const [result, setResult] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const testEmail = useAction(api.actions.testEmail.testEmail)

  const handleTestEmail = async () => {
    if (!email) {
      setError('Please enter an email address')
      return
    }

    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      const emailResult = await testEmail({ to: email })
      setResult(emailResult)
      console.log('Email test result:', emailResult)
    } catch (err: any) {
      setError(err.message || 'Failed to send test email')
      console.error('Email test error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Test Email Functionality</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="test@example.com"
            />
          </div>

          <Button 
            onClick={handleTestEmail} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Sending Test Email...' : 'Send Test Email'}
          </Button>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {result && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-600 font-medium">Email sent successfully!</p>
              <div className="mt-2 text-xs text-green-700">
                <p><strong>Provider:</strong> {result.provider}</p>
                <p><strong>To:</strong> {result.to}</p>
                <p><strong>Subject:</strong> {result.subject}</p>
                {result.previewUrl && (
                  <p><strong>Preview URL:</strong> <a href={result.previewUrl} target="_blank" rel="noopener noreferrer" className="underline">{result.previewUrl}</a></p>
                )}
              </div>
            </div>
          )}

          <div className="text-xs text-gray-500 mt-4">
            <p><strong>Note:</strong> In development, emails are sent to Ethereal (test account).</p>
            <p>Check the console for the preview URL to view the email.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
