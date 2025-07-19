import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'

export async function PUT(request: NextRequest) {
  try {
    // Require admin authentication
    const adminUser = await requireAdmin()
    
    const { userIds, status } = await request.json()

    // Validate input
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'User IDs array is required' },
        { status: 400 }
      )
    }

    // Validate status
    const validStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'BLOCKED']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status' },
        { status: 400 }
      )
    }

    // Check if any of the users is the current admin
    if (userIds.includes(adminUser.id)) {
      return NextResponse.json(
        { success: false, error: 'Cannot change your own status' },
        { status: 400 }
      )
    }

    // Get existing users to validate they exist
    const existingUsers = await prisma.user.findMany({
      where: {
        id: { in: userIds }
      },
      select: {
        id: true,
        email: true,
        status: true
      }
    })

    if (existingUsers.length !== userIds.length) {
      return NextResponse.json(
        { success: false, error: 'Some users not found' },
        { status: 404 }
      )
    }

    // Update all users in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const updatedUsers = await tx.user.updateMany({
        where: {
          id: { in: userIds }
        },
        data: {
          status: status as any,
          updatedAt: new Date()
        }
      })

      // Get the updated users for response
      const users = await tx.user.findMany({
        where: {
          id: { in: userIds }
        },
        select: {
          id: true,
          email: true,
          status: true,
          credits: true,
          role: true,
          registrationDate: true,
          updatedAt: true
        }
      })

      return { count: updatedUsers.count, users }
    })

    // Log the batch status change for audit purposes
    console.log(`Admin ${adminUser.email} changed status of ${result.count} users to ${status}`)

    return NextResponse.json({
      success: true,
      data: {
        updatedCount: result.count,
        users: result.users
      },
      message: `${result.count} user(s) status updated to ${status.toLowerCase()}`
    })

  } catch (error) {
    console.error('Batch update user status error:', error)
    
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