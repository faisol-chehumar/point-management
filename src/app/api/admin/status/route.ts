import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-utils'

/**
 * Admin status endpoint - verifies admin access
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin()
    
    return NextResponse.json({
      success: true,
      message: 'Admin access verified',
      data: {
        adminId: admin.id,
        email: admin.email,
        role: admin.role
      }
    })
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Unauthorized' || error.message === 'Admin access required') {
        return NextResponse.json(
          { success: false, error: 'Admin access required' },
          { status: 401 }
        )
      }
    }

    console.error('Admin status check error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}