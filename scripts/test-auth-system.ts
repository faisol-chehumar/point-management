import { prisma } from '../src/lib/prisma'
import bcrypt from 'bcryptjs'

async function testAuthSystem() {
  console.log('🔧 Testing Authentication System...')
  
  try {
    // Test database connection
    console.log('📊 Testing database connection...')
    await prisma.$connect()
    console.log('✅ Database connection successful')
    
    // Test user creation (similar to registration endpoint)
    console.log('👤 Testing user creation...')
    const testEmail = `test-${Date.now()}@example.com`
    const testPassword = 'TestPassword123'
    const hashedPassword = await bcrypt.hash(testPassword, 12)
    
    const testUser = await prisma.user.create({
      data: {
        email: testEmail,
        password: hashedPassword,
        status: 'PENDING',
        credits: 0,
        role: 'USER'
      }
    })
    console.log('✅ User created successfully:', testUser.email)
    
    // Test password verification
    console.log('🔐 Testing password verification...')
    const isPasswordValid = await bcrypt.compare(testPassword, testUser.password)
    console.log('✅ Password verification:', isPasswordValid ? 'PASSED' : 'FAILED')
    
    // Test user lookup
    console.log('🔍 Testing user lookup...')
    const foundUser = await prisma.user.findUnique({
      where: { email: testEmail }
    })
    console.log('✅ User lookup successful:', foundUser?.email)
    
    // Clean up test user
    console.log('🧹 Cleaning up test data...')
    await prisma.user.delete({
      where: { id: testUser.id }
    })
    console.log('✅ Test data cleaned up')
    
    console.log('\n🎉 Authentication system test completed successfully!')
    
  } catch (error) {
    console.error('❌ Authentication system test failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

testAuthSystem()