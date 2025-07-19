import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Validation schema for credit adjustment
const creditAdjustmentSchema = z.object({
  amount: z.number().int().min(-1000).max(1000),
  reason: z.string().min(1).max(255).optional()
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require admin authentication
    const adminUser = await requireAdmin()
    
    const body = await request.json()
    const { id: userId } = await params

    // Validate request body
    const validation = creditAdjustmentSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid request data',
          details: validation.error.issues
        },
        { status: 400 }
      )
    }

    const { amount, reason } = validation.data

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        credits: true,
        status: true
      }
    })

    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Calculate new credit balance
    const newCredits = Math.max(0, existingUser.credits + amount)
    
    // Determine new status based on credits
    let newStatus = existingUser.status
    if (existingUser.status === 'BLOCKED' && newCredits > 0) {
      newStatus = 'APPROVED' // Unblock user if they get credits
    } else if (newCredits === 0 && existingUser.status === 'APPROVED') {
      newStatus = 'BLOCKED' // Block user if credits reach zero
    }

    // Perform transaction to update user and create credit log
    const result = await prisma.$transaction(async (tx) => {
      // Update user credits and status
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          credits: newCredits,
          status: newStatus,
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

      // Create credit log entry
      const creditLog = await tx.creditLog.create({
        data: {
          userId: userId,
          amount: amount,
          type: amount > 0 ? 'ADDED' : 'DEDUCTED',
          reason: reason || (amount > 0 ? 'Credits added by admin' : 'Credits deducted by admin'),
          adminId: adminUser.id
        }
      })

      return { updatedUser, creditLog }
    })

    // Log the credit change for audit purposes
    console.log(`Admin ${adminUser.email} ${amount > 0 ? 'added' : 'deducted'} ${Math.abs(amount)} credits ${amount > 0 ? 'to' : 'from'} user ${existingUser.email}`)

    return NextResponse.json({
      success: true,
      data: result.updatedUser,
      message: `${Math.abs(amount)} credits ${amount > 0 ? 'added' : 'deducted'} successfully`
    })

  } catch (error) {
    console.error('Update user credits error:', error)
    
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