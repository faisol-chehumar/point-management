import { test, expect } from '@playwright/test';
import { prisma } from '../../src/lib/prisma';
import bcrypt from 'bcryptjs';

test.describe('Admin Login Flow E2E', () => {
  const adminEmail = 'admin@example.com';
  const adminPassword = 'admin123';
  const testAdminEmail = `test-admin-${Date.now()}@example.com`;
  const testAdminPassword = 'TestAdmin123!';

  test.beforeEach(async () => {
    // Ensure we have a test admin user for isolated tests
    const hashedPassword = await bcrypt.hash(testAdminPassword, 12);
    await prisma.user.upsert({
      where: { email: testAdminEmail },
      update: {
        password: hashedPassword,
        status: 'APPROVED',
        role: 'ADMIN',
        credits: 100
      },
      create: {
        email: testAdminEmail,
        password: hashedPassword,
        status: 'APPROVED',
        role: 'ADMIN',
        credits: 100
      }
    });
  });

  test.afterEach(async () => {
    // Clean up test admin user
    try {
      await prisma.user.deleteMany({
        where: { email: testAdminEmail }
      });
    } catch (error) {
      console.log('Cleanup error (expected if user not found):', error);
    }
  });

  test('should successfully login as admin and access admin dashboard', async ({ page }) => {
    // Navigate to sign in page
    await page.goto('/auth/signin');

    // Verify sign in page loaded
    await expect(page.locator('text=Sign In')).toBeVisible();

    // Fill in admin credentials
    await page.fill('input[name="email"]', testAdminEmail);
    await page.fill('input[name="password"]', testAdminPassword);

    // Submit login form
    await page.click('button[type="submit"]');

    // Wait for navigation and success message
    await expect(page.locator('text=Login successful!')).toBeVisible();
    
    // Wait for redirect to dashboard
    await page.waitForLoadState('networkidle');
    
    // Should be redirected to admin dashboard (not regular user dashboard)
    // Check for admin-specific content
    await expect(page.locator('text=Welcome back,')).toBeVisible();
    await expect(page.locator('text=admin dashboard')).toBeVisible();
    
    // Verify admin dashboard elements are present
    await expect(page.locator('text=Total Users')).toBeVisible();
    await expect(page.locator('text=Pending Approval')).toBeVisible();
    await expect(page.locator('text=Active Users')).toBeVisible();
    await expect(page.locator('text=Quick Actions')).toBeVisible();
    await expect(page.locator('text=User Management')).toBeVisible();
    await expect(page.locator('text=Credit Management')).toBeVisible();
  });

  test('should redirect admin to admin dashboard, not regular user dashboard', async ({ page }) => {
    await page.goto('/auth/signin');

    // Login as admin
    await page.fill('input[name="email"]', testAdminEmail);
    await page.fill('input[name="password"]', testAdminPassword);
    await page.click('button[type="submit"]');

    // Wait for redirect
    await page.waitForLoadState('networkidle');

    // Should be on admin page, not regular dashboard
    const currentUrl = page.url();
    expect(currentUrl).toContain('/admin');
    expect(currentUrl).not.toContain('/dashboard');
  });

  test('should show admin stats and data correctly', async ({ page }) => {
    await page.goto('/auth/signin');

    // Login as admin
    await page.fill('input[name="email"]', testAdminEmail);
    await page.fill('input[name="password"]', testAdminPassword);
    await page.click('button[type="submit"]');

    await page.waitForLoadState('networkidle');

    // Verify admin stats are displayed with numbers
    const totalUsersElement = page.locator('text=Total Users').locator('..').locator('div').nth(1);
    await expect(totalUsersElement).toBeVisible();
    
    const totalUsersText = await totalUsersElement.textContent();
    expect(totalUsersText).toMatch(/\d+/); // Should contain at least one number

    // Verify other stat cards
    await expect(page.locator('text=Pending Approval')).toBeVisible();
    await expect(page.locator('text=Active Users')).toBeVisible();
    await expect(page.locator('text=Total Credits')).toBeVisible();
    await expect(page.locator('text=New Registrations')).toBeVisible();
    await expect(page.locator('text=Credit Transactions')).toBeVisible();
  });

  test('should provide navigation to admin sub-pages', async ({ page }) => {
    await page.goto('/auth/signin');

    // Login as admin
    await page.fill('input[name="email"]', testAdminEmail);
    await page.fill('input[name="password"]', testAdminPassword);
    await page.click('button[type="submit"]');

    await page.waitForLoadState('networkidle');

    // Test navigation to User Management
    await page.click('text=Manage Users');
    await page.waitForLoadState('networkidle');
    
    let currentUrl = page.url();
    expect(currentUrl).toContain('/admin/users');

    // Go back to admin dashboard
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    // Test navigation to Credit Management
    await page.click('text=Manage Credits');
    await page.waitForLoadState('networkidle');
    
    currentUrl = page.url();
    expect(currentUrl).toContain('/admin/credits');
  });

  test('should show system status indicators', async ({ page }) => {
    await page.goto('/auth/signin');

    // Login as admin
    await page.fill('input[name="email"]', testAdminEmail);
    await page.fill('input[name="password"]', testAdminPassword);
    await page.click('button[type="submit"]');

    await page.waitForLoadState('networkidle');

    // Verify system status section
    await expect(page.locator('text=System Status')).toBeVisible();
    await expect(page.locator('text=Authentication System')).toBeVisible();
    await expect(page.locator('text=User Management System')).toBeVisible();
    await expect(page.locator('text=Credit Deduction System')).toBeVisible();
    await expect(page.locator('text=Database Connection')).toBeVisible();

    // All should show "Active" or "Connected" status
    const activeStatuses = page.locator('text=Active');
    const connectedStatuses = page.locator('text=Connected');
    
    expect(await activeStatuses.count() + await connectedStatuses.count()).toBeGreaterThan(0);
  });

  test('should prevent non-admin user from accessing admin dashboard', async ({ page }) => {
    // Create a regular user
    const regularUserEmail = `regular-${Date.now()}@example.com`;
    const regularUserPassword = 'Regular123!';
    const hashedPassword = await bcrypt.hash(regularUserPassword, 12);
    
    await prisma.user.create({
      data: {
        email: regularUserEmail,
        password: hashedPassword,
        status: 'APPROVED',
        role: 'USER',
        credits: 10
      }
    });

    try {
      await page.goto('/auth/signin');

      // Login as regular user
      await page.fill('input[name="email"]', regularUserEmail);
      await page.fill('input[name="password"]', regularUserPassword);
      await page.click('button[type="submit"]');

      await page.waitForLoadState('networkidle');

      // Try to access admin dashboard directly
      await page.goto('/admin');
      await page.waitForLoadState('networkidle');

      // Should be redirected away from admin page
      const currentUrl = page.url();
      expect(currentUrl).not.toContain('/admin');
      
      // Should be on unauthorized page or redirected elsewhere
      expect(
        currentUrl.includes('/unauthorized') ||
        currentUrl.includes('/dashboard') ||
        currentUrl.includes('/auth/signin')
      ).toBeTruthy();

    } finally {
      // Clean up regular user
      await prisma.user.deleteMany({
        where: { email: regularUserEmail }
      });
    }
  });

  test('should handle admin login with wrong credentials', async ({ page }) => {
    await page.goto('/auth/signin');

    // Try to login with wrong password
    await page.fill('input[name="email"]', testAdminEmail);
    await page.fill('input[name="password"]', 'wrong-password');
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.locator('text=Invalid Credentials')).toBeVisible();
    
    // Should still be on sign in page
    const currentUrl = page.url();
    expect(currentUrl).toContain('/auth/signin');
  });

  test('should show loading state during admin login', async ({ page }) => {
    await page.goto('/auth/signin');

    // Fill in credentials
    await page.fill('input[name="email"]', testAdminEmail);
    await page.fill('input[name="password"]', testAdminPassword);

    // Submit and immediately check for loading state
    await page.click('button[type="submit"]');
    
    // Verify loading state (spinner and disabled button)
    await expect(page.locator('button[type="submit"]')).toBeDisabled();
    await expect(page.locator('.animate-spin')).toBeVisible();
  });

  test('should maintain admin session across page refreshes', async ({ page }) => {
    await page.goto('/auth/signin');

    // Login as admin
    await page.fill('input[name="email"]', testAdminEmail);
    await page.fill('input[name="password"]', testAdminPassword);
    await page.click('button[type="submit"]');

    await page.waitForLoadState('networkidle');

    // Verify we're on admin dashboard
    expect(page.url()).toContain('/admin');

    // Refresh the page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Should still be logged in and on admin dashboard
    expect(page.url()).toContain('/admin');
    await expect(page.locator('text=Welcome back,')).toBeVisible();
  });

  test('should display admin email in welcome message', async ({ page }) => {
    await page.goto('/auth/signin');

    // Login as admin
    await page.fill('input[name="email"]', testAdminEmail);
    await page.fill('input[name="password"]', testAdminPassword);
    await page.click('button[type="submit"]');

    await page.waitForLoadState('networkidle');

    // Check that admin email is displayed in welcome message
    await expect(page.locator(`text=Welcome back, ${testAdminEmail}`)).toBeVisible();
  });
});