import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const currentUser = await requireAuth()
    
    // Fetch fresh user data from database
    const user = await prisma.user.findUnique({
      where: { id: currentUser.id },
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
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Calculate estimated expiry date if user has credits
    let estimatedExpiryDate = null
    if (user.credits > 0 && user.status === 'APPROVED') {
      const today = new Date()
      estimatedExpiryDate = new Date(today.getTime() + (user.credits * 24 * 60 * 60 * 1000))
    }

    return NextResponse.json({
      success: true,
      data: {
        ...user,
        estimatedExpiryDate,
        daysSinceRegistration: Math.floor(
          (Date.now() - user.registrationDate.getTime()) / (1000 * 60 * 60 * 24)
        )
      }
    })

  } catch (error) {
    console.error('Get user error:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}