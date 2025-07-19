import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'

/**
 * API endpoint to automatically block users with zero credits
 * This can be called by the daily credit deduction process or manually by admins
 */
export async function POST(request: NextRequest) {
  try {
    // Require admin authentication
    await requireAdmin()
    
    // Find all users with 0 credits who are still approved
    const usersToBlock = await prisma.user.findMany({
      where: {
        credits: 0,
        status: 'APPROVED'
      },
      select: {
        id: true,
        email: true,
        credits: true
      }
    })

    if (usersToBlock.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No users need to be blocked',
        data: {
          blockedCount: 0,
          blockedUsers: []
        }
      })
    }

    // Block all users with zero credits
    const updateResult = await prisma.user.updateMany({
      where: {
        credits: 0,
        status: 'APPROVED'
      },
      data: {
        status: 'BLOCKED'
      }
    })

    // Log the blocking action for each user
    const creditLogs = usersToBlock.map(user => ({
      userId: user.id,
      amount: 0,
      type: 'DEDUCTED' as const,
      reason: 'Automatic blocking due to zero credits',
      createdAt: new Date()
    }))

    await prisma.creditLog.createMany({
      data: creditLogs
    })

    console.log(`Automatically blocked ${updateResult.count} users with zero credits`)

    return NextResponse.json({
      success: true,
      message: `Successfully blocked ${updateResult.count} users with zero credits`,
      data: {
        blockedCount: updateResult.count,
        blockedUsers: usersToBlock.map(user => ({
          id: user.id,
          email: user.email,
          credits: user.credits
        }))
      }
    })

  } catch (error) {
    console.error('Block zero credits error:', error)
    
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