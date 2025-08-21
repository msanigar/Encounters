'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PROVIDER_CREDENTIALS } from '@/convex/lib/constants'

export default function ProviderLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (email === PROVIDER_CREDENTIALS.email && password === PROVIDER_CREDENTIALS.password) {
      // Set provider session (in real app, this would be a proper session)
      localStorage.setItem('providerId', PROVIDER_CREDENTIALS.id)
      localStorage.setItem('providerName', PROVIDER_CREDENTIALS.name)
      localStorage.setItem('providerRoom', PROVIDER_CREDENTIALS.room)
      router.push('/provider/dashboard')
    } else {
      setError('Invalid credentials. Use provider@demo.test / demo123')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900">
            Provider Login
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Sign in to access your telehealth dashboard
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="provider@demo.test"
                required
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="demo123"
                required
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full">
              Sign In
            </Button>
          </form>

          <div className="mt-6 p-4 bg-blue-50 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>Demo Credentials:</strong><br />
              Email: provider@demo.test<br />
              Password: demo123
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
