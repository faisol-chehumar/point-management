import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import CreditDisplay from '@/components/dashboard/CreditDisplay'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { UserWithStats } from '@/types/database'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/auth/signin')
  }

  // Handle different user statuses with redirects
  if (session.user.status === 'PENDING') {
    redirect('/pending')
  }
  
  if (session.user.status === 'REJECTED') {
    redirect('/rejected')
  }
  
  if (session.user.status === 'BLOCKED' || session.user.credits <= 0) {
    redirect('/blocked')
  }

  // Fetch fresh user data with additional stats
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      status: true,
      credits: true,
      role: true,
      registrationDate: true,
      lastCreditDeduction: true,
      createdAt: true,
      updatedAt: true
    }
  })

  if (!user) {
    redirect('/auth/signin')
  }

  // Calculate estimated expiry date if user has credits
  let estimatedExpiryDate = null
  if (user.credits > 0 && user.status === 'APPROVED') {
    const today = new Date()
    estimatedExpiryDate = new Date(today.getTime() + (user.credits * 24 * 60 * 60 * 1000))
  }

  const userWithStats: UserWithStats = {
    ...user,
    estimatedExpiryDate,
    daysSinceRegistration: Math.floor(
      (Date.now() - user.registrationDate.getTime()) / (1000 * 60 * 60 * 24)
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user.email.split('@')[0]}!
          </h1>
          <p className="text-gray-600 mt-2">
            Here's an overview of your account status and credit balance.
          </p>
        </div>

        {/* Credit Display Component */}
        <CreditDisplay user={userWithStats} />

        {/* Additional Dashboard Content */}
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {/* Quick Actions */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Quick Actions
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Access Protected Content</span>
                <span className="text-sm font-medium text-green-600">
                  {user.credits > 0 ? 'Available' : 'Blocked'}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Account Status</span>
                <span className="text-sm font-medium capitalize">
                  {user.status.toLowerCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Usage Information */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Usage Information
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Daily Credit Deduction</span>
                <span className="text-sm font-medium">1 credit/day</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Next Deduction</span>
                <span className="text-sm font-medium">
                  {new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleDateString()}
                </span>
              </div>
              {user.credits > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Days Remaining</span>
                  <span className="text-sm font-medium text-blue-600">
                    ~{user.credits} days
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}