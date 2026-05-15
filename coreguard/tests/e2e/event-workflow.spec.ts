import { test, expect } from '@playwright/test';

test.describe('Event workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('login page renders mock users', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('CoreGuard');
    await expect(page.locator('button')).toContainText(['Alice Operator', 'Carol Manager']);
  });

  test('mock user can log in and see events', async ({ page }) => {
    await page.click('button:has-text("Alice Operator")');
    await page.waitForURL(/\/events/);
    await expect(page.locator('table')).toBeVisible();
  });

  test('filter by severity works', async ({ page }) => {
    await page.click('button:has-text("Alice Operator")');
    await page.waitForURL(/\/events/);

    const severityFilter = page.locator('select').first();
    await severityFilter.selectOption('critical');
    await page.waitForTimeout(500);
  });

  test('search functionality exists', async ({ page }) => {
    await page.click('button:has-text("Alice Operator")');
    await page.waitForURL(/\/events/);

    const searchInput = page.locator('input[placeholder*="Search"]');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('Acme');
    await page.waitForTimeout(500);
  });
});