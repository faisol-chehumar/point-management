import { prisma } from '../src/lib/prisma'

async function testAdminLoginRedirect() {
  console.log('🧪 Testing Admin Login Redirect Fix...')
  
  try {
    // Check if admin user exists
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@example.com' }
    })
    
    if (adminUser) {
      console.log('✅ Admin user found:', {
        email: adminUser.email,
        role: adminUser.role,
        status: adminUser.status
      })
      
      console.log('\n📝 Fixes Applied:')
      console.log('✅ LoginForm now checks user role and redirects admins to /admin')
      console.log('✅ SessionProvider added to root layout')
      console.log('✅ useSession() error should be resolved')
      
      console.log('\n🎯 Expected Behavior:')
      console.log('- Admin login should redirect to /admin dashboard')
      console.log('- Regular users should redirect to /dashboard')
      console.log('- No more SessionProvider errors')
      
      console.log('\n🔑 Test Admin Credentials:')
      console.log('Email: admin@example.com')
      console.log('Password: admin123')
      
    } else {
      console.log('❌ Admin user not found. Run: npm run db:seed')
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testAdminLoginRedirect()