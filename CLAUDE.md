# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A SaaS member management system with user registration, admin approval workflows, credit-based access control, and automated daily credit deduction. Built with Next.js 15, TypeScript, Prisma ORM, PostgreSQL, and NextAuth.js.

## Key Architecture

### Tech Stack
- **Frontend**: Next.js 15 App Router with TypeScript
- **UI**: Tailwind CSS + Shadcn/ui components
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with credentials provider
- **Automation**: node-cron for scheduled tasks
- **Password Security**: bcrypt with 12 salt rounds

### Core Models
- **User**: Authentication, status tracking (PENDING/APPROVED/REJECTED/BLOCKED), credit management, role-based access (USER/ADMIN)
- **CreditLog**: Comprehensive audit trail for all credit operations (ADDED/DEDUCTED/DAILY_DEDUCTION)

### Authentication Flow
- Users register with PENDING status
- Admin approval required for access
- JWT sessions with 24-hour expiration
- Role-based and status-based access control
- Credit-based blocking system

### API Structure
- `/api/auth/*` - NextAuth.js authentication endpoints
- `/api/admin/*` - Admin-only endpoints (user management, stats)
- `/api/users/*` - User profile and credit management
- `/api/credits/*` - Credit operations and daily deduction
- `/api/protected/*` - General authenticated endpoints

## Development Commands

### Quick Start
```bash
# Full development setup
npm run dev:full                    # Starts Docker DB + setup + development server

# Individual steps
npm run docker:db:start            # Start PostgreSQL in Docker
npm run db:setup                   # Generate client + migrate + seed
npm run dev                        # Start development server
```

### Database Management
```bash
npm run db:generate                # Generate Prisma client (after schema changes)
npm run db:migrate                 # Run database migrations
npm run db:push                    # Push schema changes (development)
npm run db:seed                    # Seed database with test data
npm run db:studio                  # Open Prisma Studio GUI
npm run db:test                    # Test database connection
```

### Docker Database Operations
```bash
npm run docker:db:start            # Start PostgreSQL container
npm run docker:db:stop             # Stop container
npm run docker:db:restart          # Restart container
npm run docker:db:status           # Check container status
npm run docker:db:logs             # View database logs
npm run docker:db:connect          # Connect via psql
npm run docker:adminer             # Start Adminer web UI (localhost:8080)
npm run docker:db:reset            # Reset database (WARNING: deletes all data)
```

### Build & Quality
```bash
npm run build                      # Build for production
npm run start                      # Start production server
npm run lint                       # Run ESLint
```

### Testing & Verification
```bash
npx tsx scripts/test-db-connection.ts        # Test database connectivity
npx tsx scripts/test-auth-system.ts          # Test authentication system
npx tsx scripts/test-admin-system.ts         # Test admin functionality
npx tsx scripts/test-credit-blocking.ts      # Test credit blocking system
npx tsx scripts/verify-admin-implementation.ts  # Verify admin implementation
```

## Database Configuration

### Connection
- **Development**: Docker PostgreSQL on localhost:5432
- **Database**: saas_member_system
- **Credentials**: postgres/postgres123 (development only)
- **Connection String**: `DATABASE_URL` in `.env.local`

### Adminer Access
- **URL**: http://localhost:8080 (after `npm run docker:adminer`)
- **Server**: postgres
- **Username**: postgres
- **Password**: postgres123
- **Database**: saas_member_system

## Key File Locations

### Configuration
- `prisma/schema.prisma` - Database schema and models
- `src/lib/auth.ts` - NextAuth.js configuration
- `src/lib/prisma.ts` - Prisma client singleton
- `src/middleware.ts` - Route protection and access control

### Authentication & Authorization
- `src/lib/auth-utils.ts` - Server-side auth utilities (requireAuth, requireAdmin)
- `src/components/auth/` - Client-side auth components (ProtectedRoute, SessionProvider)
- `src/types/next-auth.d.ts` - NextAuth type extensions

### Admin System
- `src/app/admin/` - Admin dashboard pages
- `src/components/admin/` - Admin-specific components
- `src/app/api/admin/` - Admin API endpoints

## Development Workflow

### After Schema Changes
```bash
npm run db:generate                # Generate new Prisma client
npm run db:migrate                 # Create and apply migration
```

### Adding New Features
1. Update Prisma schema if needed
2. Generate client and migrate
3. Implement API routes with proper auth checks
4. Add UI components following existing patterns
5. Test with appropriate test scripts

### Authentication Patterns
```typescript
// Server-side (API routes)
import { requireAuth, requireAdmin } from '@/lib/auth-utils'
const user = await requireAuth()                    // Basic auth
const admin = await requireAdmin()                  // Admin required

// Client-side (components)
import ProtectedRoute from '@/components/auth/ProtectedRoute'
<ProtectedRoute requireAdmin>...</ProtectedRoute>   // Admin only
<ProtectedRoute requireApproved>...</ProtectedRoute> // Approved users only
```

## Component Patterns

### UI Components
- Use Shadcn/ui components from `src/components/ui/`
- Follow existing styling patterns with Tailwind CSS
- Implement proper loading states and error handling

### Forms
- Use react-hook-form with Zod validation
- Follow patterns in `src/lib/validations/`
- Implement proper client and server-side validation

## Important Notes

- **Database**: Always use Docker for local development to ensure consistency
- **Security**: User passwords are hashed with bcrypt (12 salt rounds)
- **Sessions**: JWT tokens expire after 24 hours
- **Status Flow**: PENDING → APPROVED/REJECTED → BLOCKED (admin controlled)
- **Credits**: Track all operations in CreditLog for audit trail
- **Middleware**: Handles route protection and status-based redirects automatically