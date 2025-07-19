#!/usr/bin/env tsx

/**
 * Test script for daily credit deduction functionality
 * This script tests both the API endpoint and the business logic
 */

import { prisma } from '../src/lib/prisma';
import { UserStatus } from '@prisma/client';

const API_BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';
const CRON_SECRET_TOKEN = process.env.CRON_SECRET_TOKEN;

interface TestUser {
  id: string;
  email: string;
  credits: number;
  status: UserStatus;
}

async function setupTestData(): Promise<TestUser[]> {
  console.log('Setting up test data...');
  
  // Clean up any existing test users
  await prisma.user.deleteMany({
    where: {
      email: {
        startsWith: 'test-deduction-'
      }
    }
  });
  
  // Create test users with different scenarios
  const testUsers = await Promise.all([
    // User with 5 credits - should be deducted to 4
    prisma.user.create({
      data: {
        email: 'test-deduction-user1@example.com',
        password: 'hashedpassword123',
        status: UserStatus.APPROVED,
        credits: 5,
        role: 'USER'
      }
    }),
    
    // User with 1 credit - should be deducted to 0 and blocked
    prisma.user.create({
      data: {
        email: 'test-deduction-user2@example.com',
        password: 'hashedpassword123',
        status: UserStatus.APPROVED,
        credits: 1,
        role: 'USER'
      }
    }),
    
    // User with 0 credits - should not be processed
    prisma.user.create({
      data: {
        email: 'test-deduction-user3@example.com',
        password: 'hashedpassword123',
        status: UserStatus.APPROVED,
        credits: 0,
        role: 'USER'
      }
    }),
    
    // Pending user with credits - should not be processed
    prisma.user.create({
      data: {
        email: 'test-deduction-user4@example.com',
        password: 'hashedpassword123',
        status: UserStatus.PENDING,
        credits: 3,
        role: 'USER'
      }
    }),
    
    // Blocked user with credits - should not be processed
    prisma.user.create({
      data: {
        email: 'test-deduction-user5@example.com',
        password: 'hashedpassword123',
        status: UserStatus.BLOCKED,
        credits: 2,
        role: 'USER'
      }
    })
  ]);
  
  console.log(`Created ${testUsers.length} test users`);
  return testUsers;
}

async function testAPIEndpoint(): Promise<boolean> {
  console.log('\n=== Testing API Endpoint ===');
  
  if (!CRON_SECRET_TOKEN) {
    console.error('CRON_SECRET_TOKEN not set. Please check your environment variables.');
    return false;
  }
  
  try {
    // Test GET endpoint first
    console.log('Testing GET /api/credits/deduct-daily...');
    const getResponse = await fetch(`${API_BASE_URL}/api/credits/deduct-daily`);
    
    if (!getResponse.ok) {
      console.error(`GET request failed with status: ${getResponse.status}`);
      return false;
    }
    
    const getResult = await getResponse.json();
    console.log('GET endpoint response:', getResult);
    
    // Test POST endpoint
    console.log('\nTesting POST /api/credits/deduct-daily...');
    const postResponse = await fetch(`${API_BASE_URL}/api/credits/deduct-daily`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CRON_SECRET_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!postResponse.ok) {
      console.error(`POST request failed with status: ${postResponse.status}`);
      const errorText = await postResponse.text();
      console.error('Error response:', errorText);
      return false;
    }
    
    const postResult = await postResponse.json();
    console.log('POST endpoint response:', postResult);
    
    return postResult.success;
    
  } catch (error) {
    console.error('API test failed:', error);
    return false;
  }
}

async function verifyResults(): Promise<boolean> {
  console.log('\n=== Verifying Results ===');
  
  try {
    const users = await prisma.user.findMany({
      where: {
        email: {
          startsWith: 'test-deduction-'
        }
      },
      orderBy: {
        email: 'asc'
      }
    });
    
    console.log('User states after deduction:');
    let allTestsPassed = true;
    
    // Test user 1: 5 credits -> 4 credits, still approved
    const user1 = users.find(u => u.email === 'test-deduction-user1@example.com');
    if (user1) {
      console.log(`User 1: ${user1.credits} credits, status: ${user1.status}`);
      if (user1.credits !== 4 || user1.status !== UserStatus.APPROVED) {
        console.error('❌ User 1 test failed');
        allTestsPassed = false;
      } else {
        console.log('✅ User 1 test passed');
      }
    }
    
    // Test user 2: 1 credit -> 0 credits, blocked
    const user2 = users.find(u => u.email === 'test-deduction-user2@example.com');
    if (user2) {
      console.log(`User 2: ${user2.credits} credits, status: ${user2.status}`);
      if (user2.credits !== 0 || user2.status !== UserStatus.BLOCKED) {
        console.error('❌ User 2 test failed');
        allTestsPassed = false;
      } else {
        console.log('✅ User 2 test passed');
      }
    }
    
    // Test user 3: 0 credits -> 0 credits, still approved (not processed)
    const user3 = users.find(u => u.email === 'test-deduction-user3@example.com');
    if (user3) {
      console.log(`User 3: ${user3.credits} credits, status: ${user3.status}`);
      if (user3.credits !== 0 || user3.status !== UserStatus.APPROVED) {
        console.error('❌ User 3 test failed');
        allTestsPassed = false;
      } else {
        console.log('✅ User 3 test passed');
      }
    }
    
    // Test user 4: 3 credits -> 3 credits, still pending (not processed)
    const user4 = users.find(u => u.email === 'test-deduction-user4@example.com');
    if (user4) {
      console.log(`User 4: ${user4.credits} credits, status: ${user4.status}`);
      if (user4.credits !== 3 || user4.status !== UserStatus.PENDING) {
        console.error('❌ User 4 test failed');
        allTestsPassed = false;
      } else {
        console.log('✅ User 4 test passed');
      }
    }
    
    // Test user 5: 2 credits -> 2 credits, still blocked (not processed)
    const user5 = users.find(u => u.email === 'test-deduction-user5@example.com');
    if (user5) {
      console.log(`User 5: ${user5.credits} credits, status: ${user5.status}`);
      if (user5.credits !== 2 || user5.status !== UserStatus.BLOCKED) {
        console.error('❌ User 5 test failed');
        allTestsPassed = false;
      } else {
        console.log('✅ User 5 test passed');
      }
    }
    
    // Check credit logs
    const creditLogs = await prisma.creditLog.findMany({
      where: {
        userId: {
          in: users.map(u => u.id)
        },
        type: 'DAILY_DEDUCTION'
      }
    });
    
    console.log(`\nCreated ${creditLogs.length} credit log entries`);
    
    // Should have 2 credit logs (for user 1 and user 2)
    if (creditLogs.length !== 2) {
      console.error('❌ Credit log count test failed');
      allTestsPassed = false;
    } else {
      console.log('✅ Credit log count test passed');
    }
    
    return allTestsPassed;
    
  } catch (error) {
    console.error('Result verification failed:', error);
    return false;
  }
}

async function cleanup(): Promise<void> {
  console.log('\n=== Cleaning Up ===');
  
  try {
    await prisma.user.deleteMany({
      where: {
        email: {
          startsWith: 'test-deduction-'
        }
      }
    });
    console.log('Test users cleaned up');
  } catch (error) {
    console.error('Cleanup failed:', error);
  }
}

async function runTest(): Promise<void> {
  console.log('🧪 Starting Daily Credit Deduction Test');
  console.log('=====================================');
  
  try {
    // Setup test data
    await setupTestData();
    
    // Test the API endpoint
    const apiSuccess = await testAPIEndpoint();
    
    if (!apiSuccess) {
      console.error('❌ API test failed');
      await cleanup();
      process.exit(1);
    }
    
    // Verify results
    const resultsCorrect = await verifyResults();
    
    if (resultsCorrect) {
      console.log('\n🎉 All tests passed! Daily credit deduction is working correctly.');
    } else {
      console.error('\n❌ Some tests failed. Please check the implementation.');
    }
    
    // Cleanup
    await cleanup();
    
    console.log('\n✅ Test completed');
    
  } catch (error) {
    console.error('Test failed with error:', error);
    await cleanup();
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  runTest();
}