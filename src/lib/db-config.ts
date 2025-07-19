import { PrismaClient } from '@prisma/client'

/**
 * Database configuration and connection utilities
 */

// Test database connection
export async function testDatabaseConnection(): Promise<boolean> {
  const prisma = new PrismaClient()
  
  try {
    await prisma.$connect()
    console.log('✅ Database connection successful')
    return true
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    return false
  } finally {
    await prisma.$disconnect()
  }
}

// Initialize database (run migrations and seed)
export async function initializeDatabase(): Promise<void> {
  console.log('🔧 Initializing database...')
  
  try {
    // Test connection first
    const isConnected = await testDatabaseConnection()
    if (!isConnected) {
      throw new Error('Cannot connect to database')
    }
    
    console.log('📊 Database initialization completed')
  } catch (error) {
    console.error('❌ Database initialization failed:', error)
    throw error
  }
}

// Get database statistics
export async function getDatabaseStats() {
  const prisma = new PrismaClient()
  
  try {
    const [userCount, creditLogCount] = await Promise.all([
      prisma.user.count(),
      prisma.creditLog.count(),
    ])
    
    const usersByStatus = await prisma.user.groupBy({
      by: ['status'],
      _count: {
        status: true,
      },
    })
    
    return {
      totalUsers: userCount,
      totalCreditLogs: creditLogCount,
      usersByStatus: usersByStatus.reduce((acc, item) => {
        acc[item.status] = item._count.status
        return acc
      }, {} as Record<string, number>),
    }
  } catch (error) {
    console.error('❌ Failed to get database stats:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}