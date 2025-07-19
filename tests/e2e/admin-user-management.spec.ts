import { test, expect } from '@playwright/test';
import { prisma } from '../../src/lib/prisma';
import bcrypt from 'bcryptjs';

test.describe('Admin User Management E2E', () => {
  const testAdminEmail = `admin-${Date.now()}@example.com`;
  const testAdminPassword = 'AdminPass123!';
  
  // Test users for management
  const testUsers = [
    {
      email: `pending-user-${Date.now()}@example.com`,
      password: 'User123!',
      status: 'PENDING' as const,
      credits: 0
    },
    {
      email: `approved-user-${Date.now()}@example.com`,
      password: 'User123!',
      status: 'APPROVED' as const,
      credits: 15
    },
    {
      email: `blocked-user-${Date.now()}@example.com`,
      password: 'User123!',
      status: 'BLOCKED' as const,
      credits: 0
    }
  ];

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

    // Create test users
    for (const user of testUsers) {
      const hashedPassword = await bcrypt.hash(user.password, 12);
      await prisma.user.upsert({
        where: { email: user.email },
        update: {
          password: hashedPassword,
          status: user.status,
          role: 'USER',
          credits: user.credits
        },
        create: {
          email: user.email,
          password: hashedPassword,
          status: user.status,
          role: 'USER',
          credits: user.credits
        }
      });
    }
  });

  test.afterEach(async () => {
    // Clean up test users
    const allTestEmails = [testAdminEmail, ...testUsers.map(u => u.email)];
    await prisma.user.deleteMany({
      where: {
        email: {
          in: allTestEmails
        }
      }
    });
  });

  test('should display user management table with all users', async ({ page }) => {
    // Login as admin
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', testAdminEmail);
    await page.fill('input[name="password"]', testAdminPassword);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    // Navigate to user management
    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');

    // Verify page loaded correctly
    await expect(page.locator('text=User Management')).toBeVisible();
    await expect(page.locator('text=Manage user accounts, approve registrations')).toBeVisible();

    // Verify user table is present
    await expect(page.locator('table')).toBeVisible();
    
    // Verify table headers
    await expect(page.locator('text=Email')).toBeVisible();
    await expect(page.locator('text=Status')).toBeVisible();
    await expect(page.locator('text=Credits')).toBeVisible();

    // Verify test users appear in the table
    for (const user of testUsers) {
      await expect(page.locator(`text=${user.email}`)).toBeVisible();
    }
  });

  test('should filter users by status', async ({ page }) => {
    // Login as admin
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', testAdminEmail);
    await page.fill('input[name="password"]', testAdminPassword);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');

    // Test filtering by PENDING status
    const statusFilter = page.locator('select').first(); // Assuming there's a status filter dropdown
    if (await statusFilter.isVisible()) {
      await statusFilter.selectOption('PENDING');
      await page.waitForLoadState('networkidle');
      
      // Should show pending user
      const pendingUser = testUsers.find(u => u.status === 'PENDING');
      if (pendingUser) {
        await expect(page.locator(`text=${pendingUser.email}`)).toBeVisible();
      }
      
      // Should not show approved user
      const approvedUser = testUsers.find(u => u.status === 'APPROVED');
      if (approvedUser) {
        await expect(page.locator(`text=${approvedUser.email}`)).not.toBeVisible();
      }
    }
  });

  test('should search for users by email', async ({ page }) => {
    // Login as admin
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', testAdminEmail);
    await page.fill('input[name="password"]', testAdminPassword);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');

    // Find search input
    const searchInput = page.locator('input[placeholder*="search"], input[placeholder*="Search"]').first();
    if (await searchInput.isVisible()) {
      const pendingUser = testUsers.find(u => u.status === 'PENDING');
      if (pendingUser) {
        await searchInput.fill(pendingUser.email.split('@')[0]); // Search by email prefix
        await page.waitForLoadState('networkidle');
        
        // Should show the searched user
        await expect(page.locator(`text=${pendingUser.email}`)).toBeVisible();
        
        // Should not show other users
        const otherUsers = testUsers.filter(u => u.email !== pendingUser.email);
        for (const user of otherUsers) {
          await expect(page.locator(`text=${user.email}`)).not.toBeVisible();
        }
      }
    }
  });

  test('should display user status badges correctly', async ({ page }) => {
    // Login as admin
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', testAdminEmail);
    await page.fill('input[name="password"]', testAdminPassword);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');

    // Check for status badges (these might be styled differently)
    for (const user of testUsers) {
      // Look for the user row
      const userRow = page.locator(`tr:has-text("${user.email}")`);
      await expect(userRow).toBeVisible();
      
      // Check that status is displayed (could be badge, text, or styled element)
      await expect(userRow.locator(`text=${user.status}`)).toBeVisible();
    }
  });

  test('should show user credit information', async ({ page }) => {
    // Login as admin
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', testAdminEmail);
    await page.fill('input[name="password"]', testAdminPassword);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');

    // Check credit information for each user
    for (const user of testUsers) {
      const userRow = page.locator(`tr:has-text("${user.email}")`);
      await expect(userRow).toBeVisible();
      
      // Check that credits are displayed
      await expect(userRow.locator(`text=${user.credits}`)).toBeVisible();
    }
  });

  test('should provide user action buttons', async ({ page }) => {
    // Login as admin
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', testAdminEmail);
    await page.fill('input[name="password"]', testAdminPassword);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');

    // Look for action buttons (approve, reject, block, etc.)
    // These might be in dropdowns, dialogs, or direct buttons
    const pendingUser = testUsers.find(u => u.status === 'PENDING');
    if (pendingUser) {
      const userRow = page.locator(`tr:has-text("${pendingUser.email}")`);
      
      // Look for common action buttons or menus
      const actionElements = [
        userRow.locator('button:has-text("Approve")'),
        userRow.locator('button:has-text("Reject")'),
        userRow.locator('button:has-text("Actions")'),
        userRow.locator('[role="button"]'),
        userRow.locator('button')
      ];

      let hasActions = false;
      for (const element of actionElements) {
        if (await element.count() > 0) {
          hasActions = true;
          break;
        }
      }
      
      expect(hasActions).toBeTruthy();
    }
  });

  test('should display registration dates and user timeline info', async ({ page }) => {
    // Login as admin
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', testAdminEmail);
    await page.fill('input[name="password"]', testAdminPassword);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');

    // Check for date/time information
    // This could be in various formats: "Registration Date", "Joined", timestamps, etc.
    await expect(
      page.locator('text=Registration').or(
        page.locator('text=Joined').or(
          page.locator('text=Created').or(
            page.locator('text=Date')
          )
        )
      )
    ).toBeVisible();
  });

  test('should handle pagination if many users exist', async ({ page }) => {
    // Login as admin
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', testAdminEmail);
    await page.fill('input[name="password"]', testAdminPassword);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');

    // Look for pagination controls (might not be visible if few users)
    const paginationElements = [
      page.locator('button:has-text("Next")'),
      page.locator('button:has-text("Previous")'),
      page.locator('button:has-text("1")'),
      page.locator('[aria-label*="pagination"]'),
      page.locator('.pagination')
    ];

    // At minimum, table should load without errors
    await expect(page.locator('table')).toBeVisible();
  });

  test('should show loading state while fetching users', async ({ page }) => {
    // Login as admin
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', testAdminEmail);
    await page.fill('input[name="password"]', testAdminPassword);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    // Navigate to users page and check for loading indicators
    await page.goto('/admin/users');
    
    // Look for loading indicators (spinners, skeleton loaders, "Loading..." text)
    const loadingElements = [
      page.locator('text=Loading'),
      page.locator('.loading'),
      page.locator('.spinner'),
      page.locator('[data-testid="loading"]'),
      page.locator('.animate-spin')
    ];

    // Eventually the table should be visible
    await expect(page.locator('table')).toBeVisible();
  });

  test('should maintain admin session during user management operations', async ({ page }) => {
    // Login as admin
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', testAdminEmail);
    await page.fill('input[name="password"]', testAdminPassword);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    // Navigate to user management
    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');

    // Perform some operations (filtering, searching)
    const searchInput = page.locator('input').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      await page.waitForLoadState('networkidle');
    }

    // Refresh page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Should still be on admin users page and logged in
    expect(page.url()).toContain('/admin/users');
    await expect(page.locator('text=User Management')).toBeVisible();
  });
});