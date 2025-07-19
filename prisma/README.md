# Database Setup

This directory contains the Prisma schema and database-related files for the SaaS Member System.

## Schema Overview

The database consists of two main models:

### User Model
- **id**: Unique identifier (CUID)
- **email**: User's email address (unique)
- **password**: Hashed password using bcrypt
- **status**: User status (PENDING, APPROVED, REJECTED, BLOCKED)
- **credits**: Current credit balance
- **role**: User role (USER, ADMIN)
- **registrationDate**: When the user registered
- **lastCreditDeduction**: Last time credits were deducted
- **createdAt/updatedAt**: Timestamps

### CreditLog Model
- **id**: Unique identifier (CUID)
- **userId**: Reference to User
- **amount**: Credit amount (positive for additions, negative for deductions)
- **type**: Type of credit operation (ADDED, DEDUCTED, DAILY_DEDUCTION)
- **reason**: Optional reason for the credit change
- **adminId**: Admin who made the change (if applicable)
- **createdAt**: Timestamp

## Setup Instructions

### Prerequisites
- PostgreSQL database running
- DATABASE_URL configured in `.env.local`

### Quick Setup
```bash
# Run the complete database setup
npm run db:setup
```

### Manual Setup
```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed with test data
npm run db:seed
```

### Development Commands
```bash
# Open Prisma Studio (database GUI)
npm run db:studio

# Push schema changes without migration
npm run db:push

# Reset database (careful!)
npx prisma migrate reset
```

## Test Data

The seed script creates:

### Admin User
- **Email**: admin@example.com
- **Password**: admin123
- **Role**: ADMIN
- **Credits**: 100

### Test Users
- **pending@example.com** - Status: PENDING, Credits: 0
- **approved@example.com** - Status: APPROVED, Credits: 30
- **blocked@example.com** - Status: BLOCKED, Credits: 0
- **rejected@example.com** - Status: REJECTED, Credits: 0

All test users have password: `password123`

### Sample Credit Logs
The approved user has sample credit log entries showing:
- Initial credit allocation
- Daily deductions
- Manual adjustments

## Environment Variables

Required in `.env.local`:
```
DATABASE_URL="postgresql://username:password@localhost:5432/saas_member_system"
```

## Troubleshooting

### Connection Issues
- Ensure PostgreSQL is running
- Verify DATABASE_URL is correct
- Check if database exists
- Confirm user has proper permissions

### Migration Issues
- Use `npx prisma db push` if migrations fail
- Reset with `npx prisma migrate reset` if needed
- Check for schema conflicts

### Seed Issues
- Ensure migrations are applied first
- Check for unique constraint violations
- Verify bcrypt is working properly