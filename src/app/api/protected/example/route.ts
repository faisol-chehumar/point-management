import { NextRequest, NextResponse } from 'next/server'
import { requireCredits } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  try {
    // This endpoint requires credits - will automatically block users with 0 credits
    const user = await requireCredits()
    
    return NextResponse.json({
      success: true,
      message: 'Access granted to protected content',
      data: {
        userId: user.id,
        credits: user.credits,
        accessTime: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Protected API error:', error)
    
    if (error instanceof Error) {
      if (error.message === 'Unauthorized') {
        return NextResponse.json(
          { success: false, error: 'Authentication required' },
          { status: 401 }
        )
      }
      
      if (error.message.includes('No credits remaining') || 
          error.message.includes('blocked') ||
          error.message.includes('rejected') ||
          error.message.includes('pending')) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 403 }
        )
      }
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}