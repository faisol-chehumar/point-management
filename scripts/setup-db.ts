#!/usr/bin/env tsx

/**
 * Database setup script
 * This script will:
 * 1. Test database connection
 * 2. Run migrations
 * 3. Seed the database with test data
 */

import { execSync } from 'child_process'
import { testDatabaseConnection, getDatabaseStats } from '../src/lib/db-config'

async function setupDatabase() {
  console.log('🚀 Starting database setup...')
  
  try {
    // Test connection
    console.log('1️⃣ Testing database connection...')
    const isConnected = await testDatabaseConnection()
    
    if (!isConnected) {
      console.log('❌ Database connection failed. Please ensure:')
      console.log('   - PostgreSQL is running')
      console.log('   - DATABASE_URL is correctly set in .env.local')
      console.log('   - Database exists and is accessible')
      process.exit(1)
    }
    
    // Generate Prisma client
    console.log('2️⃣ Generating Prisma client...')
    execSync('npx prisma generate', { stdio: 'inherit' })
    
    // Run migrations
    console.log('3️⃣ Running database migrations...')
    try {
      execSync('npx prisma migrate dev --name init', { stdio: 'inherit' })
    } catch (error) {
      console.log('ℹ️ Migration may have already been applied or database needs to be created')
      // Try db push as alternative
      console.log('3️⃣ Trying database push...')
      execSync('npx prisma db push', { stdio: 'inherit' })
    }
    
    // Seed database
    console.log('4️⃣ Seeding database with test data...')
    execSync('npm run db:seed', { stdio: 'inherit' })
    
    // Show stats
    console.log('5️⃣ Database setup completed! Here are the stats:')
    const stats = await getDatabaseStats()
    console.log('📊 Database Statistics:')
    console.log(`   Total Users: ${stats.totalUsers}`)
    console.log(`   Total Credit Logs: ${stats.totalCreditLogs}`)
    console.log('   Users by Status:')
    Object.entries(stats.usersByStatus).forEach(([status, count]) => {
      console.log(`     ${status}: ${count}`)
    })
    
    console.log('✅ Database setup completed successfully!')
    console.log('🎯 You can now start the development server with: npm run dev')
    
  } catch (error) {
    console.error('❌ Database setup failed:', error)
    process.exit(1)
  }
}

// Run the setup
setupDatabase()