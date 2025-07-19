#!/usr/bin/env tsx

/**
 * Test script to verify credit-based access control functionality
 * This script tests the automatic blocking when credits reach zero
 */

import { PrismaClient } from '@prisma/client'
import { checkAndBlockZeroCredits } from '../src/lib/auth-utils'

const prisma = new PrismaClient()

async function testCreditBlocking() {
  console.log('🧪 Testing Credit-Based Access Control System')
  console.log('=' .repeat(50))

  try {
    // 1. Create a test user with zero credits
    console.log('\n1. Creating test user with zero credits...')
    const testUser = await prisma.user.create({
      data: {
        email: 'test-zero-credits@example.com',
        password: 'hashedpassword123',
        status: 'APPROVED',
        credits: 0,
        role: 'USER'
      }
    })
    console.log(`✅ Created test user: ${testUser.email} (ID: ${testUser.id})`)
    console.log(`   Status: ${testUser.status}, Credits: ${testUser.credits}`)

    // 2. Test the automatic blocking function
    console.log('\n2. Testing automatic blocking of zero-credit users...')
    const blockingResult = await checkAndBlockZeroCredits()
    console.log(`✅ Blocking completed:`)
    console.log(`   Users blocked: ${blockingResult.blockedCount}`)
    console.log(`   Blocked users: ${blockingResult.blockedUsers.map(u => u.email).join(', ')}`)

    // 3. Verify the user was blocked
    console.log('\n3. Verifying user status after blocking...')
    const updatedUser = await prisma.user.findUnique({
      where: { id: testUser.id }
    })
    
    if (updatedUser) {
      console.log(`✅ User status updated:`)
      console.log(`   Status: ${updatedUser.status}`)
      console.log(`   Credits: ${updatedUser.credits}`)
      
      if (updatedUser.status === 'BLOCKED') {
        console.log('✅ SUCCESS: User was automatically blocked due to zero credits')
      } else {
        console.log('❌ FAILURE: User was not blocked as expected')
      }
    }

    // 4. Check credit logs
    console.log('\n4. Checking credit logs...')
    const creditLogs = await prisma.creditLog.findMany({
      where: { userId: testUser.id },
      orderBy: { createdAt: 'desc' }
    })
    
    console.log(`✅ Found ${creditLogs.length} credit log entries:`)
    creditLogs.forEach((log, index) => {
      console.log(`   ${index + 1}. ${log.type}: ${log.amount} credits - ${log.reason}`)
    })

    // 5. Test with user who has credits (should not be blocked)
    console.log('\n5. Testing user with credits (should not be blocked)...')
    const userWithCredits = await prisma.user.create({
      data: {
        email: 'test-with-credits@example.com',
        password: 'hashedpassword123',
        status: 'APPROVED',
        credits: 5,
        role: 'USER'
      }
    })
    
    const blockingResult2 = await checkAndBlockZeroCredits()
    console.log(`✅ Second blocking test completed:`)
    console.log(`   Users blocked: ${blockingResult2.blockedCount}`)
    
    const userWithCreditsAfter = await prisma.user.findUnique({
      where: { id: userWithCredits.id }
    })
    
    if (userWithCreditsAfter?.status === 'APPROVED') {
      console.log('✅ SUCCESS: User with credits was not blocked')
    } else {
      console.log('❌ FAILURE: User with credits was incorrectly blocked')
    }

    // Cleanup
    console.log('\n6. Cleaning up test data...')
    await prisma.creditLog.deleteMany({
      where: {
        userId: {
          in: [testUser.id, userWithCredits.id]
        }
      }
    })
    
    await prisma.user.deleteMany({
      where: {
        id: {
          in: [testUser.id, userWithCredits.id]
        }
      }
    })
    console.log('✅ Test data cleaned up')

    console.log('\n🎉 Credit-based access control test completed successfully!')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the test
testCreditBlocking().catch((error) => {
  console.error('Test execution failed:', error)
  process.exit(1)
})