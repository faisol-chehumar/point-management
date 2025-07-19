import { PrismaClient, UserStatus, UserRole, CreditLogType } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Hash passwords for test users
  const hashedPassword = await bcrypt.hash('password123', 12)
  const hashedAdminPassword = await bcrypt.hash('admin123', 12)

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: hashedAdminPassword,
      status: UserStatus.APPROVED,
      role: UserRole.ADMIN,
      credits: 100,
      registrationDate: new Date(),
    },
  })

  console.log('✅ Created admin user:', admin.email)

  // Create test users with different statuses
  const testUsers = [
    {
      email: 'pending@example.com',
      status: UserStatus.PENDING,
      credits: 0,
    },
    {
      email: 'approved@example.com',
      status: UserStatus.APPROVED,
      credits: 30,
    },
    {
      email: 'blocked@example.com',
      status: UserStatus.BLOCKED,
      credits: 0,
    },
    {
      email: 'rejected@example.com',
      status: UserStatus.REJECTED,
      credits: 0,
    },
  ]

  const createdUsers = []
  for (const userData of testUsers) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        email: userData.email,
        password: hashedPassword,
        status: userData.status,
        role: UserRole.USER,
        credits: userData.credits,
        registrationDate: new Date(),
      },
    })
    createdUsers.push(user)
    console.log(`✅ Created test user: ${user.email} (${user.status})`)
  }

  // Create sample credit logs for the approved user
  const approvedUser = createdUsers.find(u => u.status === UserStatus.APPROVED)
  if (approvedUser) {
    const creditLogs = [
      {
        userId: approvedUser.id,
        amount: 50,
        type: CreditLogType.ADDED,
        reason: 'Initial credit allocation',
        adminId: admin.id,
      },
      {
        userId: approvedUser.id,
        amount: -1,
        type: CreditLogType.DAILY_DEDUCTION,
        reason: 'Daily automatic deduction',
      },
      {
        userId: approvedUser.id,
        amount: -19,
        type: CreditLogType.DEDUCTED,
        reason: 'Manual adjustment by admin',
        adminId: admin.id,
      },
    ]

    for (const logData of creditLogs) {
      await prisma.creditLog.create({
        data: {
          ...logData,
          createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random date within last week
        },
      })
    }
    console.log(`✅ Created ${creditLogs.length} credit log entries`)
  }

  console.log('🎉 Database seed completed successfully!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })