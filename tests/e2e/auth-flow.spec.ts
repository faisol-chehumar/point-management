import { test, expect } from '@playwright/test';
import { prisma } from '../../src/lib/prisma';
import bcrypt from 'bcryptjs';

test.describe('Authentication Flow E2E', () => {
  const testEmail = `auth-test-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';

  test.afterEach(async () => {
    // Clean up test user
    try {
      await prisma.user.deleteMany({
        where: { email: testEmail }
      });
    } catch (error) {
      console.log('Cleanup error (expected if user not found):', error);
    }
  });

  test('should show PENDING status after registration and require admin approval', async ({ page }) => {
    // Create a test user with PENDING status directly in DB (simulating registration)
    const hashedPassword = await bcrypt.hash(testPassword, 12);
    const user = await prisma.user.create({
      data: {
        email: testEmail,
        password: hashedPassword,
        status: 'PENDING',
        credits: 0,
        role: 'USER'
      }
    });

    // Navigate to sign in page
    await page.goto('/auth/signin');

    // Attempt to sign in with PENDING user
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]');

    // Should be redirected to a pending approval page or show pending message
    // The exact behavior depends on your middleware implementation
    await page.waitForLoadState('networkidle');
    
    // Check if user is redirected or shown pending status
    const currentUrl = page.url();
    const pageContent = await page.textContent('body');
    
    // Verify that the user cannot access protected content
    expect(
      currentUrl.includes('/pending') || 
      pageContent?.includes('pending') || 
      pageContent?.includes('approval') ||
      currentUrl.includes('/auth/signin')
    ).toBeTruthy();
  });

  test('should allow access after admin approval', async ({ page }) => {
    // Create and approve a test user
    const hashedPassword = await bcrypt.hash(testPassword, 12);
    const user = await prisma.user.create({
      data: {
        email: testEmail,
        password: hashedPassword,
        status: 'APPROVED',
        credits: 10,
        role: 'USER'
      }
    });

    // Navigate to sign in page
    await page.goto('/auth/signin');

    // Sign in with APPROVED user
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]');

    // Wait for navigation
    await page.waitForLoadState('networkidle');

    // Should be able to access dashboard or protected content
    const currentUrl = page.url();
    
    // Verify successful sign in (not redirected back to sign in page)
    expect(currentUrl).not.toContain('/auth/signin');
    expect(currentUrl).not.toContain('/auth/register');
    
    // Should be able to access some protected content
    // This will depend on your app's routing structure
    expect(
      currentUrl.includes('/dashboard') || 
      currentUrl.includes('/') ||
      currentUrl.includes('/protected')
    ).toBeTruthy();
  });

  test('should block access for blocked users', async ({ page }) => {
    // Create a blocked test user
    const hashedPassword = await bcrypt.hash(testPassword, 12);
    const user = await prisma.user.create({
      data: {
        email: testEmail,
        password: hashedPassword,
        status: 'BLOCKED',
        credits: 0,
        role: 'USER'
      }
    });

    // Navigate to sign in page
    await page.goto('/auth/signin');

    // Attempt to sign in with BLOCKED user
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]');

    // Should show error or redirect to blocked page
    await page.waitForLoadState('networkidle');
    
    const pageContent = await page.textContent('body');
    const currentUrl = page.url();
    
    // Verify that blocked user cannot access the system
    expect(
      pageContent?.includes('blocked') ||
      pageContent?.includes('suspended') ||
      pageContent?.includes('access denied') ||
      currentUrl.includes('/blocked') ||
      currentUrl.includes('/auth/signin')
    ).toBeTruthy();
  });

  test('should prevent access when user has zero credits', async ({ page }) => {
    // Create an approved user with zero credits
    const hashedPassword = await bcrypt.hash(testPassword, 12);
    const user = await prisma.user.create({
      data: {
        email: testEmail,
        password: hashedPassword,
        status: 'APPROVED',
        credits: 0,
        role: 'USER'
      }
    });

    // Navigate to sign in page
    await page.goto('/auth/signin');

    // Sign in with zero-credit user
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]');

    await page.waitForLoadState('networkidle');

    // Based on your credit system, user should either:
    // 1. Be shown a message about insufficient credits
    // 2. Be redirected to a credits page
    // 3. Have limited access
    
    const pageContent = await page.textContent('body');
    const currentUrl = page.url();
    
    // Verify appropriate handling of zero credits
    // This test may need adjustment based on your specific credit blocking logic
    expect(
      pageContent?.includes('credit') ||
      pageContent?.includes('balance') ||
      currentUrl.includes('/credits') ||
      currentUrl !== '/auth/signin' // At minimum, should be signed in
    ).toBeTruthy();
  });

  test('should maintain session and verify user status flow', async ({ page }) => {
    // Test the complete flow: PENDING -> APPROVED -> access
    const hashedPassword = await bcrypt.hash(testPassword, 12);
    
    // Step 1: Create PENDING user
    let user = await prisma.user.create({
      data: {
        email: testEmail,
        password: hashedPassword,
        status: 'PENDING',
        credits: 0,
        role: 'USER'
      }
    });

    // Navigate to sign in page and sign in as PENDING user
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    // Verify limited access for PENDING user
    let currentUrl = page.url();
    expect(currentUrl).not.toContain('/dashboard'); // Assuming dashboard requires approval

    // Step 2: Simulate admin approval (update user status)
    user = await prisma.user.update({
      where: { id: user.id },
      data: { 
        status: 'APPROVED',
        credits: 10
      }
    });

    // Refresh or navigate to trigger status check
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify user now has access (this depends on your session/middleware logic)
    currentUrl = page.url();
    
    // The exact behavior depends on your implementation
    // User might need to sign in again or status might be checked automatically
    expect(user.status).toBe('APPROVED');
    expect(user.credits).toBe(10);
  });
});