import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { NextRequest } from 'next/server'

/**
 * Get the current user session on the server side
 */
export async function getCurrentUser() {
  const session = await getServerSession(authOptions)
  return session?.user || null
}

/**
 * Check if the current user is an admin
 */
export async function isAdmin() {
  const user = await getCurrentUser()
  return user?.role === 'ADMIN'
}

/**
 * Check if the current user has access (not blocked/rejected)
 */
export async function hasAccess() {
  const user = await getCurrentUser()
  if (!user) return false
  
  return user.status === 'APPROVED' && user.credits > 0
}

/**
 * Require authentication for API routes
 */
export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }
  return user
}

/**
 * Require admin role for API routes
 */
export async function requireAdmin() {
  const user = await requireAuth()
  if (user.role !== 'ADMIN') {
    throw new Error('Admin access required')
  }
  return user
}

/**
 * Check user access and throw error if blocked
 */
export async function requireAccess() {
  const user = await requireAuth()
  
  if (user.status === 'REJECTED') {
    throw new Error('Account has been rejected')
  }
  
  if (user.status === 'BLOCKED') {
    throw new Error('Account has been blocked due to insufficient credits')
  }
  
  if (user.status === 'PENDING') {
    throw new Error('Account is pending approval')
  }
  
  if (user.credits <= 0) {
    throw new Error('Insufficient credits')
  }
  
  return user
}

/**
 * Require credits for API routes - blocks access when credits reach 0
 */
export async function requireCredits() {
  const user = await requireAuth()
  
  // Check if user status allows access
  if (user.status === 'REJECTED') {
    throw new Error('Account has been rejected')
  }
  
  if (user.status === 'PENDING') {
    throw new Error('Account is pending approval')
  }
  
  // Critical: Block access immediately when credits reach 0
  if (user.credits <= 0 || user.status === 'BLOCKED') {
    throw new Error('Access denied: No credits remaining')
  }
  
  return user
}

/**
 * API response helper for authentication errors
 */
export function createAuthErrorResponse(error: string, status: number = 401) {
  return Response.json(
    { success: false, error },
    { status }
  )
}

/**
 * Extract user from API request (for API routes)
 */
export async function getUserFromRequest(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    return user
  } catch (error) {
    return null
  }
}

/**
 * Check and automatically block users with zero credits
 * This function can be called during credit deduction or other operations
 */
export async function checkAndBlockZeroCredits(userId?: string) {
  try {
    
    const whereClause = userId 
      ? { id: userId, credits: 0, status: 'APPROVED' as const }
      : { credits: 0, status: 'APPROVED' as const }
    
    // Find users with zero credits who are still approved
    const usersToBlock = await prisma.user.findMany({
      where: whereClause,
      select: { id: true, email: true }
    })

    if (usersToBlock.length === 0) {
      return { blockedCount: 0, blockedUsers: [] }
    }

    // Block users with zero credits
    const updateResult = await prisma.user.updateMany({
      where: whereClause,
      data: { status: 'BLOCKED' }
    })

    // Log the blocking actions
    const creditLogs = usersToBlock.map(user => ({
      userId: user.id,
      amount: 0,
      type: 'DEDUCTED' as const,
      reason: 'Automatic blocking due to zero credits'
    }))

    await prisma.creditLog.createMany({
      data: creditLogs
    })

    return {
      blockedCount: updateResult.count,
      blockedUsers: usersToBlock
    }
  } catch (error) {
    console.error('Error checking and blocking zero credit users:', error)
    throw error
  }
}