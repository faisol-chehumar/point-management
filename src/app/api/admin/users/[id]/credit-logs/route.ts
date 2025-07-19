import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require admin authentication
    await requireAdmin()
    
    const { id: userId } = await params
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Calculate offset for pagination
    const offset = (page - 1) * limit

    // Fetch credit logs with pagination
    const [creditLogs, totalCount] = await Promise.all([
      prisma.creditLog.findMany({
        where: { userId },
        select: {
          id: true,
          amount: true,
          type: true,
          reason: true,
          createdAt: true,
          adminId: true
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit
      }),
      prisma.creditLog.count({ where: { userId } })
    ])

    // Get admin emails for logs that have adminId
    const adminIds = creditLogs
      .map(log => log.adminId)
      .filter((id): id is string => id !== null)
    
    const admins = adminIds.length > 0 ? await prisma.user.findMany({
      where: { id: { in: adminIds } },
      select: { id: true, email: true }
    }) : []

    const adminMap = new Map(admins.map(admin => [admin.id, admin.email]))

    // Enhance credit logs with admin email
    const enhancedLogs = creditLogs.map(log => ({
      ...log,
      adminEmail: log.adminId ? adminMap.get(log.adminId) || 'Unknown' : null
    }))

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email
        },
        creditLogs: enhancedLogs,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          limit,
          hasNextPage,
          hasPrevPage
        }
      }
    })

  } catch (error) {
    console.error('Get credit logs error:', error)
    
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