import { test, expect } from '@playwright/test';
import { prisma } from '../../src/lib/prisma';
import bcrypt from 'bcryptjs';

test.describe('Admin Routes Protection E2E', () => {
  const testAdminEmail = `admin-${Date.now()}@example.com`;
  const testAdminPassword = 'AdminPass123!';
  const testUserEmail = `user-${Date.now()}@example.com`;
  const testUserPassword = 'UserPass123!';

  test.beforeEach(async () => {
    // Create test admin user
    const hashedAdminPassword = await bcrypt.hash(testAdminPassword, 12);
    await prisma.user.upsert({
      where: { email: testAdminEmail },
      update: {
        password: hashedAdminPassword,
        status: 'APPROVED',
        role: 'ADMIN',
        credits: 100
      },
      create: {
        email: testAdminEmail,
        password: hashedAdminPassword,
        status: 'APPROVED',
        role: 'ADMIN',
        credits: 100
      }
    });

    // Create test regular user
    const hashedUserPassword = await bcrypt.hash(testUserPassword, 12);
    await prisma.user.upsert({
      where: { email: testUserEmail },
      update: {
        password: hashedUserPassword,
        status: 'APPROVED',
        role: 'USER',
        credits: 10
      },
      create: {
        email: testUserEmail,
        password: hashedUserPassword,
        status: 'APPROVED',
        role: 'USER',
        credits: 10
      }
    });
  });

  test.afterEach(async () => {
    // Clean up test users
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [testAdminEmail, testUserEmail]
        }
      }
    });
  });

  test('should allow admin access to all admin routes', async ({ page }) => {
    // Login as admin
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', testAdminEmail);
    await page.fill('input[name="password"]', testAdminPassword);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    // Test access to main admin dashboard
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/admin');
    await expect(page.locator('text=Welcome back,')).toBeVisible();

    // Test access to admin users page
    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/admin/users');
    await expect(page.locator('text=User Management')).toBeVisible();
    await expect(page.locator('text=Manage user accounts, approve registrations')).toBeVisible();

    // Test access to admin credits page
    await page.goto('/admin/credits');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/admin/credits');
    await expect(page.locator('text=Credit Management')).toBeVisible();
    await expect(page.locator('text=Manage user credits, view credit history')).toBeVisible();
  });

  test('should block regular user access to admin routes', async ({ page }) => {
    // Login as regular user
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', testUserEmail);
    await page.fill('input[name="password"]', testUserPassword);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    // Try to access main admin dashboard
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    
    // Should be redirected away from admin routes
    const currentUrl = page.url();
    expect(currentUrl).not.toContain('/admin');
    expect(
      currentUrl.includes('/unauthorized') ||
      currentUrl.includes('/dashboard') ||
      currentUrl.includes('/auth/signin')
    ).toBeTruthy();

    // Try to access admin users page
    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');
    expect(page.url()).not.toContain('/admin/users');

    // Try to access admin credits page
    await page.goto('/admin/credits');
    await page.waitForLoadState('networkidle');
    expect(page.url()).not.toContain('/admin/credits');
  });

  test('should block unauthenticated access to admin routes', async ({ page }) => {
    // Try to access admin routes without logging in

    // Main admin dashboard
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    
    // Should be redirected to sign in
    expect(page.url()).toContain('/auth/signin');

    // Admin users page
    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/auth/signin');

    // Admin credits page
    await page.goto('/admin/credits');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/auth/signin');
  });

  test('should block PENDING admin user from accessing admin routes', async ({ page }) => {
    // Create pending admin user
    const pendingAdminEmail = `pending-admin-${Date.now()}@example.com`;
    const pendingAdminPassword = 'PendingAdmin123!';
    const hashedPassword = await bcrypt.hash(pendingAdminPassword, 12);
    
    await prisma.user.create({
      data: {
        email: pendingAdminEmail,
        password: hashedPassword,
        status: 'PENDING',
        role: 'ADMIN',
        credits: 0
      }
    });

    try {
      // Try to login as pending admin
      await page.goto('/auth/signin');
      await page.fill('input[name="email"]', pendingAdminEmail);
      await page.fill('input[name="password"]', pendingAdminPassword);
      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle');

      // Try to access admin dashboard
      await page.goto('/admin');
      await page.waitForLoadState('networkidle');

      // Should be redirected away (pending users typically have limited access)
      const currentUrl = page.url();
      expect(
        currentUrl.includes('/pending') ||
        currentUrl.includes('/unauthorized') ||
        currentUrl.includes('/auth/signin') ||
        !currentUrl.includes('/admin')
      ).toBeTruthy();

    } finally {
      // Clean up pending admin user
      await prisma.user.deleteMany({
        where: { email: pendingAdminEmail }
      });
    }
  });

  test('should block BLOCKED admin user from accessing admin routes', async ({ page }) => {
    // Create blocked admin user
    const blockedAdminEmail = `blocked-admin-${Date.now()}@example.com`;
    const blockedAdminPassword = 'BlockedAdmin123!';
    const hashedPassword = await bcrypt.hash(blockedAdminPassword, 12);
    
    await prisma.user.create({
      data: {
        email: blockedAdminEmail,
        password: hashedPassword,
        status: 'BLOCKED',
        role: 'ADMIN',
        credits: 0
      }
    });

    try {
      // Try to login as blocked admin
      await page.goto('/auth/signin');
      await page.fill('input[name="email"]', blockedAdminEmail);
      await page.fill('input[name="password"]', blockedAdminPassword);
      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle');

      // Try to access admin dashboard
      await page.goto('/admin');
      await page.waitForLoadState('networkidle');

      // Should be redirected away or blocked
      const currentUrl = page.url();
      expect(
        currentUrl.includes('/blocked') ||
        currentUrl.includes('/unauthorized') ||
        currentUrl.includes('/auth/signin') ||
        !currentUrl.includes('/admin')
      ).toBeTruthy();

    } finally {
      // Clean up blocked admin user
      await prisma.user.deleteMany({
        where: { email: blockedAdminEmail }
      });
    }
  });

  test('should maintain admin session across different admin pages', async ({ page }) => {
    // Login as admin
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', testAdminEmail);
    await page.fill('input[name="password"]', testAdminPassword);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    // Navigate between admin pages
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/admin');

    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/admin/users');
    await expect(page.locator('text=User Management')).toBeVisible();

    await page.goto('/admin/credits');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/admin/credits');
    await expect(page.locator('text=Credit Management')).toBeVisible();

    // Go back to main admin dashboard
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/admin');
    await expect(page.locator('text=Welcome back,')).toBeVisible();
  });

  test('should show admin layout and navigation on all admin pages', async ({ page }) => {
    // Login as admin
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', testAdminEmail);
    await page.fill('input[name="password"]', testAdminPassword);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    // Check admin layout on main dashboard
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    
    // Should have admin-specific navigation/layout elements
    // (These depend on your AdminLayout component implementation)
    await expect(page.locator('text=Welcome back,')).toBeVisible();

    // Check admin layout on users page
    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=User Management')).toBeVisible();

    // Check admin layout on credits page
    await page.goto('/admin/credits');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=Credit Management')).toBeVisible();
  });

  test('should handle direct URL access to admin routes with proper authentication', async ({ page }) => {
    // Try to access admin pages directly without session

    // Main admin page
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/auth/signin');

    // Users page
    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/auth/signin');

    // Now login and try again
    await page.fill('input[name="email"]', testAdminEmail);
    await page.fill('input[name="password"]', testAdminPassword);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    // Should now be able to access admin pages
    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/admin/users');
    await expect(page.locator('text=User Management')).toBeVisible();
  });
});