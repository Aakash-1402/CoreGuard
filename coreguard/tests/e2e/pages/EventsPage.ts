import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';

export class EventsPage {
  readonly page: Page;
  readonly table: Locator;
  readonly severityFilter: Locator;
  readonly statusFilter: Locator;
  readonly sourceFilter: Locator;
  readonly searchInput: Locator;
  readonly clearFiltersBtn: Locator;
  readonly refreshBtn: Locator;
  readonly previousBtn: Locator;
  readonly nextBtn: Locator;
  readonly eventCount: Locator;
  readonly sidebarEventsLink: Locator;
  readonly sidebarDashboardLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.table = page.locator('table');
    this.severityFilter = page.locator('select').nth(0);
    this.statusFilter = page.locator('select').nth(1);
    this.sourceFilter = page.locator('select').nth(2);
    this.searchInput = page.locator('input[placeholder*="Search"]');
    this.clearFiltersBtn = page.locator('button', { hasText: 'Clear filters' });
    this.refreshBtn = page.locator('button', { hasText: 'Refresh' });
    this.previousBtn = page.locator('button', { hasText: 'Previous' });
    this.nextBtn = page.locator('button', { hasText: 'Next' });
    this.eventCount = page.locator('text=/\\d+ event/');
    this.sidebarEventsLink = page.locator('a', { hasText: 'Risk Events' });
    this.sidebarDashboardLink = page.locator('a', { hasText: 'Dashboard' });
  }

  async goto() {
    await this.page.goto('/events');
  }

  async expectPageLoaded() {
    await expect(this.table).toBeVisible();
  }

  async expectEventsVisible() {
    await expect(this.table.locator('tbody tr').first()).toBeVisible();
  }

  async getEventCount(): Promise<number> {
    const rows = await this.table.locator('tbody tr').all();
    return rows.length;
  }

  async getFirstEventId(): Promise<string> {
    const firstRow = this.table.locator('tbody tr').first();
    const href = await firstRow.locator('a, [data-event-id]').first().getAttribute('href');
    if (href) {
      return href.split('/').pop() ?? '';
    }
    const onclick = await firstRow.getAttribute('onclick');
    return '';
  }

  async clickFirstEvent() {
    await this.table.locator('tbody tr').first().click();
    await this.page.waitForURL(/\/events\/[a-f0-9-]+/);
  }

  async filterBySeverity(severity: string) {
    await this.severityFilter.selectOption(severity);
    await this.page.waitForTimeout(500);
  }

  async filterByStatus(status: string) {
    await this.statusFilter.selectOption(status);
    await this.page.waitForTimeout(500);
  }

  async filterBySource(source: string) {
    await this.sourceFilter.selectOption(source);
    await this.page.waitForTimeout(500);
  }

  async searchBy(term: string) {
    await this.searchInput.fill(term);
    await this.page.waitForTimeout(500);
  }

  async clearSearch() {
    await this.searchInput.fill('');
    await this.page.waitForTimeout(500);
  }

  async clearAllFilters() {
    await this.clearFiltersBtn.click();
    await this.page.waitForTimeout(500);
  }

  async goToNextPage() {
    await this.nextBtn.click();
    await this.page.waitForTimeout(500);
  }

  async goToPreviousPage() {
    await this.previousBtn.click();
    await this.page.waitForTimeout(500);
  }

  async refresh() {
    await this.refreshBtn.click();
    await this.page.waitForTimeout(500);
  }

  async navigateToDashboard() {
    await this.sidebarDashboardLink.click();
    await this.page.waitForURL(/\/dashboard/);
  }

  async sortBy(column: string) {
    await this.page.click(`button:has-text("${column}")`);
    await this.page.waitForTimeout(300);
  }
}
