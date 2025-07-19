import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Require admin authentication
    await requireAdmin()
    
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

    return NextResponse.json({
      success: true,
      data: {
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
    })

  } catch (error) {
    console.error('Get admin stats error:', error)
    
    if (error instanceof Error) {
      if (error.message === 'Unauthorized' || error.message === 'Admin access required') {
        return NextResponse.json(
          { success: false, error: 'Admin access required' },
          { status: 401 }
        )
      }
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}