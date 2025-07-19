#!/usr/bin/env tsx

/**
 * Simple database connection test
 */

import { testDatabaseConnection } from '../src/lib/db-config'

async function main() {
  console.log('🔍 Testing database connection...')
  
  const isConnected = await testDatabaseConnection()
  
  if (isConnected) {
    console.log('✅ Database connection test passed!')
    process.exit(0)
  } else {
    console.log('❌ Database connection test failed!')
    console.log('💡 Make sure:')
    console.log('   - PostgreSQL is running')
    console.log('   - DATABASE_URL is set correctly in .env.local')
    console.log('   - Database exists and is accessible')
    process.exit(1)
  }
}

main().catch(console.error)