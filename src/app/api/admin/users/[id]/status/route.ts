import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require admin authentication
    const adminUser = await requireAdmin()
    
    const { status } = await request.json()
    const { id: userId } = await params

    // Validate status
    const validStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'BLOCKED']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status' },
        { status: 400 }
      )
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Prevent admins from changing their own status
    if (existingUser.id === adminUser.id) {
      return NextResponse.json(
        { success: false, error: 'Cannot change your own status' },
        { status: 400 }
      )
    }

    // Update user status
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { 
        status: status as any,
        updatedAt: new Date()
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

    // Log the status change for audit purposes
    console.log(`Admin ${adminUser.email} changed user ${existingUser.email} status from ${existingUser.status} to ${status}`)

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: `User status updated to ${status.toLowerCase()}`
    })

  } catch (error) {
    console.error('Update user status error:', error)
    
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