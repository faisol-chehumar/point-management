import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Require admin authentication
    await requireAdmin()
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const search = searchParams.get('search')

    // Build where clause for filtering
    const where: any = {}
    
    if (status && status !== 'all') {
      where.status = status.toUpperCase()
    }
    
    if (search) {
      where.email = {
        contains: search,
        mode: 'insensitive'
      }
    }

    // Calculate offset for pagination
    const offset = (page - 1) * limit

    // Build orderBy clause
    const orderBy: any = {}
    orderBy[sortBy] = sortOrder

    // Fetch users with pagination and filtering
    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          status: true,
          credits: true,
          role: true,
          registrationDate: true,
          lastCreditDeduction: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              creditLogs: true
            }
          }
        },
        orderBy,
        skip: offset,
        take: limit
      }),
      prisma.user.count({ where })
    ])

    // Calculate additional user statistics
    const usersWithStats = users.map(user => {
      const daysSinceRegistration = Math.floor(
        (Date.now() - user.registrationDate.getTime()) / (1000 * 60 * 60 * 24)
      )
      
      let estimatedExpiryDate = null
      if (user.credits > 0 && user.status === 'APPROVED') {
        const today = new Date()
        estimatedExpiryDate = new Date(today.getTime() + (user.credits * 24 * 60 * 60 * 1000))
      }

      return {
        ...user,
        daysSinceRegistration,
        estimatedExpiryDate,
        creditLogCount: user._count.creditLogs
      }
    })

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    return NextResponse.json({
      success: true,
      data: {
        users: usersWithStats,
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
    console.error('Get users error:', error)
    
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