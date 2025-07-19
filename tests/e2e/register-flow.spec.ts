import { test, expect } from '@playwright/test';
import { prisma } from '../../src/lib/prisma';

test.describe('Registration Flow E2E', () => {
  const testEmail = `e2e-test-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';

  test.afterEach(async () => {
    // Clean up test user after each test
    try {
      await prisma.user.deleteMany({
        where: { email: testEmail }
      });
    } catch (error) {
      console.log('Cleanup error (expected if user not found):', error);
    }
  });

  test('should complete full registration flow successfully', async ({ page }) => {
    // Navigate to registration page
    await page.goto('/auth/register');

    // Verify page title and content
    await expect(page).toHaveTitle(/SaaS Member System/);
    await expect(page.locator('h2')).toContainText('SaaS Member System');
    await expect(page.locator('text=Create your account to get started')).toBeVisible();

    // Verify registration form is present
    await expect(page.locator('text=Create Account')).toBeVisible();
    await expect(page.locator('text=Sign up for a new account')).toBeVisible();

    // Fill out registration form
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="confirmPassword"]', testPassword);

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for success message
    await expect(page.locator('text=Registration successful!')).toBeVisible();
    await expect(page.locator('text=Please wait for admin approval')).toBeVisible();

    // Verify form is reset
    await expect(page.locator('input[name="email"]')).toHaveValue('');
    await expect(page.locator('input[name="password"]')).toHaveValue('');
    await expect(page.locator('input[name="confirmPassword"]')).toHaveValue('');

    // Verify user was created in database with PENDING status
    const user = await prisma.user.findUnique({
      where: { email: testEmail }
    });
    expect(user).toBeTruthy();
    expect(user?.email).toBe(testEmail);
    expect(user?.status).toBe('PENDING');
    expect(user?.credits).toBe(0);
    expect(user?.role).toBe('USER');
  });

  test('should show validation errors for invalid input', async ({ page }) => {
    await page.goto('/auth/register');

    // Test empty form submission
    await page.click('button[type="submit"]');
    
    // Verify validation messages appear
    await expect(page.locator('text=Email is required')).toBeVisible();
    await expect(page.locator('text=Password is required')).toBeVisible();

    // Test invalid email
    await page.fill('input[name="email"]', 'invalid-email');
    await page.fill('input[name="password"]', 'short');
    await page.fill('input[name="confirmPassword"]', 'different');
    await page.click('button[type="submit"]');

    // Verify email validation
    await expect(page.locator('text=Invalid email address')).toBeVisible();
    
    // Test weak password
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', 'weak');
    await page.fill('input[name="confirmPassword"]', 'weak');
    await page.click('button[type="submit"]');

    // Verify password validation message
    await expect(page.locator('text=Password must be at least 8 characters')).toBeVisible();
  });

  test('should show error when registering with existing email', async ({ page }) => {
    // First, create a user with the test email
    await prisma.user.create({
      data: {
        email: testEmail,
        password: 'hashedpassword',
        status: 'PENDING'
      }
    });

    await page.goto('/auth/register');

    // Try to register with existing email
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="confirmPassword"]', testPassword);
    await page.click('button[type="submit"]');

    // Verify error message
    await expect(page.locator('text=Registration failed')).toBeVisible();
    await expect(page.locator('text=User already exists')).toBeVisible();
  });

  test('should navigate to sign in page from registration page', async ({ page }) => {
    await page.goto('/auth/register');

    // Click "Sign in here" link
    await page.click('text=Sign in here');

    // Verify navigation to sign in page
    await expect(page).toHaveURL('/auth/signin');
  });

  test('should show loading state during form submission', async ({ page }) => {
    await page.goto('/auth/register');

    // Fill form
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="confirmPassword"]', testPassword);

    // Submit and immediately check for loading state
    await page.click('button[type="submit"]');
    
    // Verify loading state (spinner and disabled button)
    await expect(page.locator('button[type="submit"]')).toBeDisabled();
    await expect(page.locator('.animate-spin')).toBeVisible();
  });

  test('should disable form inputs during submission', async ({ page }) => {
    await page.goto('/auth/register');

    // Fill form
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="confirmPassword"]', testPassword);

    // Submit form
    await page.click('button[type="submit"]');

    // Verify all inputs are disabled during submission
    await expect(page.locator('input[name="email"]')).toBeDisabled();
    await expect(page.locator('input[name="password"]')).toBeDisabled();
    await expect(page.locator('input[name="confirmPassword"]')).toBeDisabled();
  });
});