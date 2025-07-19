# E2E Tests for SaaS Member System

This directory contains end-to-end tests using Playwright to verify the complete user registration and authentication flow.

## Test Files

### `register-flow.spec.ts`
Tests the complete user registration process:
- Form validation and error handling
- Successful registration with database persistence
- User feedback and UI states
- Navigation between auth pages
- Loading states and form disabling

### `auth-flow.spec.ts`
Tests the authentication and authorization flow:
- User status verification (PENDING, APPROVED, BLOCKED)
- Credit-based access control
- Session management
- Access restrictions based on user state

### `admin-login-flow.spec.ts`
Tests the admin authentication and dashboard access:
- Admin login with correct credentials
- Redirect to admin dashboard (not user dashboard)
- Admin dashboard stats and functionality
- Session persistence for admins
- Error handling for invalid admin credentials

### `admin-routes-protection.spec.ts`
Tests admin route protection and access control:
- Admin access to protected admin routes
- Blocking regular users from admin routes
- Unauthenticated access prevention
- PENDING/BLOCKED admin user restrictions
- Session maintenance across admin pages

### `admin-user-management.spec.ts`
Tests admin user management functionality:
- User management table display
- User filtering by status
- User search functionality
- Status badges and user information
- Action buttons for user operations
- Pagination and data loading

### `admin-credit-management.spec.ts`
Tests admin credit management features:
- Credit management dashboard display
- User credit information display
- Credit adjustment functionality
- Credit history access
- Search and filter capabilities
- Navigation between admin sections

## Running the Tests

### Prerequisites
1. Ensure the development server is running: `npm run dev`
2. Ensure the database is running: `npm run docker:db:start`
3. Database should be set up: `npm run db:setup`

### Available Commands

```bash
# Run all E2E tests
npm run test:e2e

# Run tests with UI (visual browser)
npm run test:e2e:ui

# Run tests in headed mode (visible browser)
npm run test:e2e:headed

# Run specific test file
npx playwright test tests/e2e/register-flow.spec.ts

# Run with debugging
npm run test:e2e:debug

# Run specific test by name
npx playwright test --grep "should complete full registration flow"
```

## Test Coverage

The E2E tests verify:

### Registration Flow
1. ✅ Complete registration process from UI to database
2. ✅ Form validation and error handling
3. ✅ Success feedback and form reset
4. ✅ Duplicate email handling
5. ✅ Loading states and input disabling
6. ✅ Navigation between auth pages

### Authentication Flow
1. ✅ PENDING user status handling
2. ✅ APPROVED user access
3. ✅ BLOCKED user restrictions
4. ✅ Credit-based access control
5. ✅ Session persistence
6. ✅ Status change effects

### Admin Login Flow
1. ✅ Admin authentication and dashboard access
2. ✅ Admin-specific route redirection
3. ✅ Admin dashboard stats and functionality
4. ✅ Session persistence for admin users
5. ✅ Error handling for invalid credentials
6. ✅ Admin email display in welcome message

### Admin Route Protection
1. ✅ Protected admin route access control
2. ✅ Regular user blocking from admin routes
3. ✅ Unauthenticated access prevention
4. ✅ PENDING/BLOCKED admin restrictions
5. ✅ Session maintenance across admin pages
6. ✅ Direct URL access handling

### Admin User Management
1. ✅ User management table display
2. ✅ User filtering and search functionality
3. ✅ Status badges and user information
4. ✅ User action buttons and operations
5. ✅ Registration dates and timeline info
6. ✅ Pagination and loading states

### Admin Credit Management
1. ✅ Credit management dashboard
2. ✅ User credit information display
3. ✅ Credit adjustment functionality
4. ✅ Credit history and logs access
5. ✅ Search and filter capabilities
6. ✅ Navigation between admin sections

### Database Integration
1. ✅ User creation with correct initial status
2. ✅ Password hashing verification
3. ✅ Status updates and access changes
4. ✅ Credit management
5. ✅ Test data cleanup

## Configuration

Tests are configured in `playwright.config.ts`:
- Base URL: `http://localhost:3000`
- Browsers: Chrome, Firefox, Safari
- Auto-start dev server for tests
- Trace on first retry for debugging

## Notes

- Tests automatically clean up test data after each run
- Unique test emails are generated using timestamps
- Tests verify both UI behavior and database state
- All tests run in isolation with fresh state