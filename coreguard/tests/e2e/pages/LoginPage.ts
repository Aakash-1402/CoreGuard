import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly subtitle: Locator;
  readonly userButtons: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.locator('h1', { hasText: 'CoreGuard' });
    this.subtitle = page.locator('p', { hasText: 'Sign in to the Risk Review Console' });
    this.userButtons = page.locator('button');
  }

  async goto() {
    await this.page.goto('/login');
  }

  async expectPageLoaded() {
    await expect(this.heading).toBeVisible();
    await expect(this.subtitle).toBeVisible();
  }

  async expectUserButtons(expectedNames: string[]) {
    for (const name of expectedNames) {
      await expect(this.page.locator('button', { hasText: name })).toBeVisible();
    }
  }

  async loginAs(userButtonLabel: string) {
    await this.page.click(`button:has-text("${userButtonLabel}")`);
    await this.page.waitForURL(/\/events/);
  }
}
