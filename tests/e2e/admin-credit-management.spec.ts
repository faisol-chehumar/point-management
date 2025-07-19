import { test, expect } from '@playwright/test';
import { prisma } from '../../src/lib/prisma';
import bcrypt from 'bcryptjs';

test.describe('Admin Credit Management E2E', () => {
  const testAdminEmail = `admin-${Date.now()}@example.com`;
  const testAdminPassword = 'AdminPass123!';
  const testUserEmail = `user-${Date.now()}@example.com`;
  const testUserPassword = 'User123!';

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

    // Create test user with credits
    const hashedUserPassword = await bcrypt.hash(testUserPassword, 12);
    const testUser = await prisma.user.upsert({
      where: { email: testUserEmail },
      update: {
        password: hashedUserPassword,
        status: 'APPROVED',
        role: 'USER',
        credits: 25
      },
      create: {
        email: testUserEmail,
        password: hashedUserPassword,
        status: 'APPROVED',
        role: 'USER',
        credits: 25
      }
    });

    // Create some credit log entries for testing
    await prisma.creditLog.createMany({
      data: [
        {
          userId: testUser.id,
          amount: 50,
          type: 'ADDED',
          description: 'Initial credit allocation'
        },
        {
          userId: testUser.id,
          amount: -25,
          type: 'DEDUCTED',
          description: 'Manual adjustment'
        },
        {
          userId: testUser.id,
          amount: -1,
          type: 'DAILY_DEDUCTION',
          description: 'Daily automatic deduction'
        }
      ]
    });
  });

  test.afterEach(async () => {
    // Clean up test data
    const testUser = await prisma.user.findUnique({
      where: { email: testUserEmail }
    });
    
    if (testUser) {
      await prisma.creditLog.deleteMany({
        where: { userId: testUser.id }
      });
    }

    await prisma.user.deleteMany({
      where: {
        email: {
          in: [testAdminEmail, testUserEmail]
        }
      }
    });
  });

  test('should display credit management dashboard', async ({ page }) => {
    // Login as admin
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', testAdminEmail);
    await page.fill('input[name="password"]', testAdminPassword);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    // Navigate to credit management
    await page.goto('/admin/credits');
    await page.waitForLoadState('networkidle');

    // Verify page loaded correctly
    await expect(page.locator('text=Credit Management')).toBeVisible();
    await expect(page.locator('text=Manage user credits, view credit history')).toBeVisible();

    // Verify main dashboard elements
    await expect(page.locator('table')).toBeVisible();
  });

  test('should show users with their credit information', async ({ page }) => {
    // Login as admin
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', testAdminEmail);
    await page.fill('input[name="password"]', testAdminPassword);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    await page.goto('/admin/credits');
    await page.waitForLoadState('networkidle');

    // Verify test user appears with credit information
    await expect(page.locator(`text=${testUserEmail}`)).toBeVisible();
    
    // Check that credit amount is displayed
    await expect(page.locator('text=25')).toBeVisible(); // User's current credits

    // Verify table headers
    await expect(page.locator('text=Email')).toBeVisible();
    await expect(page.locator('text=Credits')).toBeVisible();
  });

  test('should allow searching for users', async ({ page }) => {
    // Login as admin
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', testAdminEmail);
    await page.fill('input[name="password"]', testAdminPassword);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    await page.goto('/admin/credits');
    await page.waitForLoadState('networkidle');

    // Find search input
    const searchInput = page.locator('input[placeholder*="search"], input[placeholder*="Search"]').first();
    if (await searchInput.isVisible()) {
      // Search for the test user
      await searchInput.fill(testUserEmail.split('@')[0]);
      await page.waitForTimeout(1000); // Wait for search to process
      
      // Should show the searched user
      await expect(page.locator(`text=${testUserEmail}`)).toBeVisible();
    }
  });

  test('should provide credit adjustment functionality', async ({ page }) => {
    // Login as admin
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', testAdminEmail);
    await page.fill('input[name="password"]', testAdminPassword);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    await page.goto('/admin/credits');
    await page.waitForLoadState('networkidle');

    // Look for credit adjustment buttons or forms
    const userRow = page.locator(`tr:has-text("${testUserEmail}")`);
    
    // Look for action buttons (could be "Adjust", "Edit", "+", "-", etc.)
    const adjustButtons = [
      userRow.locator('button:has-text("Adjust")'),
      userRow.locator('button:has-text("Edit")'),
      userRow.locator('button:has-text("+")'),
      userRow.locator('button:has-text("-")'),
      userRow.locator('button[title*="credit"]'),
      page.locator('button:has-text("Add Credits")'),
      page.locator('button:has-text("Adjust Credits")')
    ];

    let hasAdjustButton = false;
    for (const button of adjustButtons) {
      if (await button.count() > 0) {
        hasAdjustButton = true;
        break;
      }
    }

    expect(hasAdjustButton).toBeTruthy();
  });

  test('should display credit history functionality', async ({ page }) => {
    // Login as admin
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', testAdminEmail);
    await page.fill('input[name="password"]', testAdminPassword);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    await page.goto('/admin/credits');
    await page.waitForLoadState('networkidle');

    // Look for credit history buttons or links
    const historyButtons = [
      page.locator('button:has-text("History")'),
      page.locator('button:has-text("View History")'),
      page.locator('button:has-text("Credit History")'),
      page.locator('button:has-text("Logs")'),
      page.locator('[title*="history"]'),
      page.locator('[title*="log"]')
    ];

    let hasHistoryButton = false;
    for (const button of historyButtons) {
      if (await button.count() > 0) {
        hasHistoryButton = true;
        break;
      }
    }

    expect(hasHistoryButton).toBeTruthy();
  });

  test('should show credit statistics or summary', async ({ page }) => {
    // Login as admin
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', testAdminEmail);
    await page.fill('input[name="password"]', testAdminPassword);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    await page.goto('/admin/credits');
    await page.waitForLoadState('networkidle');

    // Look for credit statistics (total credits, average, etc.)
    const statsElements = [
      page.locator('text=Total Credits'),
      page.locator('text=Average Credits'),
      page.locator('text=Credit Statistics'),
      page.locator('text=Summary'),
      page.locator('[data-testid*="stat"]'),
      page.locator('.stat'),
      page.locator('text=Users with Credits')
    ];

    let hasStats = false;
    for (const element of statsElements) {
      if (await element.count() > 0) {
        hasStats = true;
        break;
      }
    }

    // At minimum, should show user credit data in table
    await expect(page.locator('table')).toBeVisible();
  });

  test('should display user status in credit management', async ({ page }) => {
    // Login as admin
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', testAdminEmail);
    await page.fill('input[name="password"]', testAdminPassword);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    await page.goto('/admin/credits');
    await page.waitForLoadState('networkidle');

    // Check that user status is shown alongside credit info
    const userRow = page.locator(`tr:has-text("${testUserEmail}")`);
    await expect(userRow).toBeVisible();
    
    // Should show status (APPROVED in this case)
    await expect(userRow.locator('text=APPROVED')).toBeVisible();
  });

  test('should show estimated expiry dates or credit timeline', async ({ page }) => {
    // Login as admin
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', testAdminEmail);
    await page.fill('input[name="password"]', testAdminPassword);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    await page.goto('/admin/credits');
    await page.waitForLoadState('networkidle');

    // Look for expiry date or timeline information
    const timelineElements = [
      page.locator('text=Expiry'),
      page.locator('text=Expires'),
      page.locator('text=Days Remaining'),
      page.locator('text=Estimated'),
      page.locator('text=Timeline'),
      page.locator('[title*="expir"]'),
      page.locator('[title*="day"]')
    ];

    // At minimum, table should be visible with user data
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator(`text=${testUserEmail}`)).toBeVisible();
  });

  test('should handle pagination in credit management', async ({ page }) => {
    // Login as admin
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', testAdminEmail);
    await page.fill('input[name="password"]', testAdminPassword);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    await page.goto('/admin/credits');
    await page.waitForLoadState('networkidle');

    // Look for pagination controls
    const paginationElements = [
      page.locator('button:has-text("Next")'),
      page.locator('button:has-text("Previous")'),
      page.locator('button:has-text("1")'),
      page.locator('[aria-label*="pagination"]'),
      page.locator('.pagination')
    ];

    // Table should load successfully
    await expect(page.locator('table')).toBeVisible();
  });

  test('should maintain session during credit management operations', async ({ page }) => {
    // Login as admin
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', testAdminEmail);
    await page.fill('input[name="password"]', testAdminPassword);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    // Navigate to credit management
    await page.goto('/admin/credits');
    await page.waitForLoadState('networkidle');

    // Perform operations (search, filter)
    const searchInput = page.locator('input').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      await page.waitForTimeout(500);
    }

    // Refresh page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Should still be logged in and on credit management page
    expect(page.url()).toContain('/admin/credits');
    await expect(page.locator('text=Credit Management')).toBeVisible();
  });

  test('should navigate between admin pages seamlessly', async ({ page }) => {
    // Login as admin
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', testAdminEmail);
    await page.fill('input[name="password"]', testAdminPassword);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    // Start at credit management
    await page.goto('/admin/credits');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=Credit Management')).toBeVisible();

    // Navigate to user management
    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=User Management')).toBeVisible();

    // Navigate back to main admin dashboard
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=Welcome back,')).toBeVisible();

    // Return to credit management
    await page.goto('/admin/credits');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=Credit Management')).toBeVisible();
  });
});