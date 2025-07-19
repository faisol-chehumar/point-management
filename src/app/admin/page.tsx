import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Link from 'next/link'
import AdminLayout from '@/components/admin/AdminLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { prisma } from '@/lib/prisma'

interface AdminStats {
  userStats: {
    total: number
    pending: number
    approved: number
    rejected: number
    blocked: number
    active: number
  }
  creditStats: {
    totalCredits: number
    averageCreditsPerUser: number
  }
  recentActivity: {
    newRegistrations: number
    creditTransactions: number
  }
}

async function getAdminStats(): Promise<AdminStats> {
  // Get user statistics
  const [
    totalUsers,
    pendingUsers,
    approvedUsers,
    rejectedUsers,
    blockedUsers,
    activeUsers,
    totalCredits
  ] = await Promise.all([
    // Total users
    prisma.user.count(),
    
    // Pending users
    prisma.user.count({
      where: { status: 'PENDING' }
    }),
    
    // Approved users
    prisma.user.count({
      where: { status: 'APPROVED' }
    }),
    
    // Rejected users
    prisma.user.count({
      where: { status: 'REJECTED' }
    }),
    
    // Blocked users
    prisma.user.count({
      where: { status: 'BLOCKED' }
    }),
    
    // Active users (approved with credits > 0)
    prisma.user.count({
      where: {
        status: 'APPROVED',
        credits: { gt: 0 }
      }
    }),
    
    // Total credits across all users
    prisma.user.aggregate({
      _sum: {
        credits: true
      }
    })
  ])

  // Get recent activity (last 7 days)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  
  const [recentRegistrations, recentCreditLogs] = await Promise.all([
    prisma.user.count({
      where: {
        registrationDate: {
          gte: sevenDaysAgo
        }
      }
    }),
    
    prisma.creditLog.count({
      where: {
        createdAt: {
          gte: sevenDaysAgo
        }
      }
    })
  ])

  return {
    userStats: {
      total: totalUsers,
      pending: pendingUsers,
      approved: approvedUsers,
      rejected: rejectedUsers,
      blocked: blockedUsers,
      active: activeUsers
    },
    creditStats: {
      totalCredits: totalCredits._sum.credits || 0,
      averageCreditsPerUser: totalUsers > 0 ? Math.round((totalCredits._sum.credits || 0) / totalUsers * 100) / 100 : 0
    },
    recentActivity: {
      newRegistrations: recentRegistrations,
      creditTransactions: recentCreditLogs
    }
  }
}

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/auth/signin')
  }

  if (session.user.role !== 'ADMIN') {
    redirect('/unauthorized')
  }

  const stats = await getAdminStats()

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome back, {session.user.email}
          </h2>
          <p className="text-gray-600">
            Manage users, credits, and system settings from your admin dashboard.
          </p>
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.userStats.total}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                All registered users
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Pending Approval
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.userStats.pending}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Awaiting review
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Active Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.userStats.active}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Approved with credits
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Blocked Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.userStats.blocked}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Zero credits or blocked
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Credits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.creditStats.totalCredits}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Across all users
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                New Registrations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.recentActivity.newRegistrations}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Last 7 days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Credit Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.recentActivity.creditTransactions}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Last 7 days
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <h3 className="font-medium mb-2">User Management</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Review pending users, approve or reject applications, and manage user status.
                </p>
                <Link href="/admin/users">
                  <Button variant="outline" size="sm">
                    Manage Users
                  </Button>
                </Link>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h3 className="font-medium mb-2">Credit Management</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Add or subtract credits from user accounts and view credit history.
                </p>
                <Link href="/admin/credits">
                  <Button variant="outline" size="sm">
                    Manage Credits
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Authentication System</span>
                <Badge variant="default">Active</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">User Management System</span>
                <Badge variant="default">Active</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Credit Deduction System</span>
                <Badge variant="default">Active</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Database Connection</span>
                <Badge variant="default">Connected</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}