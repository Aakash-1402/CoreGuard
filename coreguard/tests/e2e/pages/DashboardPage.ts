import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly summaryCards: Locator;
  readonly sidebarEventsLink: Locator;
  readonly sidebarDashboardLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.locator('h2', { hasText: 'Dashboard' });
    this.summaryCards = page.locator('[class*="card"], [class*="Card"]').filter({ hasText: /critical|high|medium|low|new|reviewed/i });
    this.sidebarEventsLink = page.locator('a', { hasText: 'Risk Events' });
    this.sidebarDashboardLink = page.locator('a', { hasText: 'Dashboard' });
  }

  async goto() {
    await this.page.goto('/dashboard');
  }

  async expectPageLoaded() {
    await expect(this.heading).toBeVisible();
  }

  async expectSummaryCardsVisible() {
    await expect(this.summaryCards.first()).toBeVisible();
  }

  async navigateToEvents() {
    await this.sidebarEventsLink.click();
    await this.page.waitForURL(/\/events/);
  }
}
