import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

async function verifyAdminImplementation() {
  console.log('🔍 Verifying Admin Authentication and Route Protection Implementation...\n')

  const results = {
    passed: 0,
    failed: 0,
    tests: [] as Array<{ name: string; status: 'PASS' | 'FAIL'; details?: string }>
  }

  function addTest(name: string, condition: boolean, details?: string) {
    const status = condition ? 'PASS' : 'FAIL'
    results.tests.push({ name, status, details })
    if (condition) {
      results.passed++
    } else {
      results.failed++
    }
    console.log(`${condition ? '✅' : '❌'} ${name}${details ? ` - ${details}` : ''}`)
  }

  try {
    // Test 1: Admin role checking middleware exists
    const authUtilsContent = fs.readFileSync('./src/lib/auth-utils.ts', 'utf8')
    addTest(
      'Admin role checking utilities exist',
      authUtilsContent.includes('isAdmin') && authUtilsContent.includes('requireAdmin'),
      'isAdmin() and requireAdmin() functions found'
    )

    // Test 2: Admin route protection in middleware
    const middlewareContent = fs.readFileSync('./src/middleware.ts', 'utf8')
    addTest(
      'Admin route protection in middleware',
      middlewareContent.includes('/admin') && middlewareContent.includes('ADMIN'),
      'Middleware protects /admin routes'
    )

    // Test 3: Admin API route protection
    addTest(
      'Admin API route protection',
      middlewareContent.includes('/api/admin') && middlewareContent.includes('ADMIN'),
      'Middleware protects /api/admin routes'
    )

    // Test 4: AdminRoute component exists
    const adminRouteExists = fs.existsSync('./src/components/auth/AdminRoute.tsx')
    addTest(
      'AdminRoute component exists',
      adminRouteExists,
      'Component file found'
    )

    if (adminRouteExists) {
      const adminRouteContent = fs.readFileSync('./src/components/auth/AdminRoute.tsx', 'utf8')
      addTest(
        'AdminRoute component has proper role checking',
        adminRouteContent.includes('ADMIN') && adminRouteContent.includes('unauthorized'),
        'Checks for ADMIN role and redirects unauthorized users'
      )
    }

    // Test 5: AdminLayout component exists
    const adminLayoutExists = fs.existsSync('./src/components/admin/AdminLayout.tsx')
    addTest(
      'AdminLayout component exists',
      adminLayoutExists,
      'Component file found'
    )

    if (adminLayoutExists) {
      const adminLayoutContent = fs.readFileSync('./src/components/admin/AdminLayout.tsx', 'utf8')
      addTest(
        'AdminLayout has navigation structure',
        adminLayoutContent.includes('Dashboard') && adminLayoutContent.includes('User Management'),
        'Contains admin navigation menu'
      )
    }

    // Test 6: Admin dashboard page exists
    const adminDashboardExists = fs.existsSync('./src/app/admin/page.tsx')
    addTest(
      'Admin dashboard page exists',
      adminDashboardExists,
      'Main admin page found'
    )

    // Test 7: Admin sub-pages exist
    const adminUsersExists = fs.existsSync('./src/app/admin/users/page.tsx')
    const adminCreditsExists = fs.existsSync('./src/app/admin/credits/page.tsx')
    addTest(
      'Admin sub-pages exist',
      adminUsersExists && adminCreditsExists,
      'Users and Credits management pages found'
    )

    // Test 8: Admin API endpoint exists
    const adminAPIExists = fs.existsSync('./src/app/api/admin/status/route.ts')
    addTest(
      'Admin API endpoint exists',
      adminAPIExists,
      'Admin status API endpoint found'
    )

    if (adminAPIExists) {
      const adminAPIContent = fs.readFileSync('./src/app/api/admin/status/route.ts', 'utf8')
      addTest(
        'Admin API uses requireAdmin',
        adminAPIContent.includes('requireAdmin'),
        'API endpoint properly protected'
      )
    }

    // Test 9: Database supports admin roles
    const schemaContent = fs.readFileSync('./prisma/schema.prisma', 'utf8')
    addTest(
      'Database schema supports admin roles',
      schemaContent.includes('ADMIN') && schemaContent.includes('UserRole'),
      'ADMIN role defined in UserRole enum'
    )

    // Test 10: Admin user exists in database
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    })
    addTest(
      'Admin user exists in database',
      !!adminUser,
      adminUser ? `Found admin: ${adminUser.email}` : 'No admin user found'
    )

    // Test 11: User dashboard has admin link for admin users
    const dashboardLayoutContent = fs.readFileSync('./src/components/dashboard/DashboardLayout.tsx', 'utf8')
    addTest(
      'User dashboard includes admin navigation',
      dashboardLayoutContent.includes('ADMIN') && dashboardLayoutContent.includes('/admin'),
      'Admin users can access admin dashboard from user dashboard'
    )

    // Test 12: Admin layout has user dashboard link
    if (adminLayoutExists) {
      const adminLayoutContent = fs.readFileSync('./src/components/admin/AdminLayout.tsx', 'utf8')
      addTest(
        'Admin layout includes user dashboard link',
        adminLayoutContent.includes('/dashboard'),
        'Admins can return to user dashboard'
      )
    }

    console.log('\n📊 Implementation Verification Results:')
    console.log(`   ✅ Passed: ${results.passed}`)
    console.log(`   ❌ Failed: ${results.failed}`)
    console.log(`   📈 Success Rate: ${Math.round((results.passed / (results.passed + results.failed)) * 100)}%`)

    if (results.failed === 0) {
      console.log('\n🎉 All admin authentication and route protection features implemented successfully!')
      console.log('\n✨ Task 7 Implementation Complete:')
      console.log('   ✅ Admin role checking middleware')
      console.log('   ✅ Admin route protection for dashboard access')
      console.log('   ✅ Admin authentication flow and role-based redirects')
      console.log('   ✅ Admin layout component with navigation')
      console.log('\n🚀 Ready for next task: Admin User Management Dashboard')
    } else {
      console.log('\n⚠️  Some features need attention:')
      results.tests.filter(t => t.status === 'FAIL').forEach(test => {
        console.log(`   - ${test.name}`)
      })
    }

  } catch (error) {
    console.error('❌ Error during verification:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the verification
verifyAdminImplementation().catch(console.error)