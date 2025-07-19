'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAdmin?: boolean
  requireApproved?: boolean
  requireCredits?: boolean
}

export default function ProtectedRoute({ 
  children, 
  requireAdmin = false,
  requireApproved = false,
  requireCredits = false
}: ProtectedRouteProps) {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      if (status === 'loading') return // Still loading

      if (!session) {
        router.push('/auth/signin')
        return
      }

      // Refresh session data to get latest user info
      await update()

      // Check admin requirement
      if (requireAdmin && session.user.role !== 'ADMIN') {
        router.push('/unauthorized')
        return
      }

      // Check approval and credit requirements
      if (requireApproved || requireCredits) {
        if (session.user.status === 'PENDING') {
          router.push('/pending')
          return
        }
        
        if (session.user.status === 'REJECTED') {
          router.push('/rejected')
          return
        }
        
        if (session.user.status === 'BLOCKED') {
          router.push('/blocked')
          return
        }

        // Check credits specifically if required - immediate blocking when credits reach 0
        if (requireCredits && session.user.credits <= 0) {
          router.push('/blocked')
          return
        }
      }

      setIsChecking(false)
    }

    checkAuth()
  }, [session, status, router, requireAdmin, requireApproved, requireCredits, update])

  // Show loading while checking authentication
  if (status === 'loading' || isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render children if not authenticated or authorized
  if (!session) return null
  
  if (requireAdmin && session.user.role !== 'ADMIN') return null
  
  if (requireApproved || requireCredits) {
    if (session.user.status !== 'APPROVED') {
      return null
    }
    
    // Block access immediately when credits reach 0
    if (requireCredits && session.user.credits <= 0) {
      return null
    }
  }

  return <>{children}</>
}