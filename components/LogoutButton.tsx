'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'

export function LogoutButton() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const logoutProvider = useMutation(api.mutations.auth.logoutProvider)

  const handleLogout = async () => {
    setIsLoading(true)
    
    try {
      const sessionId = localStorage.getItem('sessionId')
      if (sessionId) {
        await logoutProvider({ sessionId: sessionId as any })
      }
      
      // Clear local storage
      localStorage.removeItem('sessionId')
      localStorage.removeItem('providerId')
      localStorage.removeItem('providerName')
      localStorage.removeItem('providerRoom')
      localStorage.removeItem('providerEmail')
      
      // Redirect to login
      router.push('/provider/login')
    } catch (error) {
      console.error('Logout error:', error)
      // Still redirect even if logout fails
      router.push('/provider/login')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleLogout}
      disabled={isLoading}
      className="text-gray-600 hover:text-gray-900"
    >
      <LogOut className="w-4 h-4 mr-2" />
      {isLoading ? 'Logging out...' : 'Logout'}
    </Button>
  )
}
