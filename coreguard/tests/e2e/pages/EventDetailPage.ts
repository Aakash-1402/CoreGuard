import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';

export class EventDetailPage {
  readonly page: Page;
  readonly detailPanel: Locator;
  readonly auditTimeline: Locator;
  readonly evidenceSection: Locator;
  readonly notesSection: Locator;
  readonly noteInput: Locator;
  readonly addNoteBtn: Locator;
  readonly ownerSelect: Locator;
  readonly assignOwnerBtn: Locator;
  readonly actionButtons: Locator;
  readonly reviewBtn: Locator;
  readonly escalateBtn: Locator;
  readonly ignoreBtn: Locator;
  readonly resolveBtn: Locator;
  readonly reopenBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.detailPanel = page.locator('text=/Severity|Status|Supplier/').first();
    this.auditTimeline = page.locator('h3', { hasText: 'Audit Timeline' });
    this.evidenceSection = page.locator('h3', { hasText: /Evidence/ });
    this.notesSection = page.locator('h3', { hasText: /Notes/ });
    this.noteInput = page.locator('input[placeholder*="Add internal note"]');
    this.addNoteBtn = page.locator('button', { hasText: 'Add' });
    this.ownerSelect = page.locator('select').first();
    this.assignOwnerBtn = page.locator('button', { hasText: 'Assign' });
    this.actionButtons = page.locator('button').filter({ hasText: /Review|Escalate|Ignore|Resolve|Reopen/ });
    this.reviewBtn = page.locator('button', { hasText: 'Review' });
    this.escalateBtn = page.locator('button', { hasText: 'Escalate' });
    this.ignoreBtn = page.locator('button', { hasText: 'Ignore' });
    this.resolveBtn = page.locator('button', { hasText: 'Resolve' });
    this.reopenBtn = page.locator('button', { hasText: 'Reopen' });
  }

  async expectPageLoaded() {
    await expect(this.auditTimeline).toBeVisible();
    await expect(this.evidenceSection).toBeVisible();
    await expect(this.notesSection).toBeVisible();
  }

  async expectActionButtonsVisible(expectedLabels: string[]) {
    for (const label of expectedLabels) {
      await expect(this.page.locator('button', { hasText: label }).first()).toBeVisible();
    }
  }

  async expectActionButtonsNotVisible(unexpectedLabels: string[]) {
    for (const label of unexpectedLabels) {
      const btn = this.page.locator('button', { hasText: label, exact: true });
      await expect(btn).not.toBeVisible();
    }
  }

  async expectResolveButtonVisible() {
    await expect(this.resolveBtn).toBeVisible();
  }

  async expectResolveButtonHidden() {
    await expect(this.resolveBtn).not.toBeVisible();
  }

  async performAction(actionLabel: string) {
    await this.page.locator('button', { hasText: actionLabel }).first().click();
    await this.page.waitForTimeout(500);
  }

  async addNote(content: string) {
    await this.noteInput.fill(content);
    await this.addNoteBtn.click();
    await this.page.waitForTimeout(500);
  }

  async expectNoteVisible(content: string) {
    await expect(this.page.locator('text=' + content)).toBeVisible();
  }

  async assignOwner(ownerName: string) {
    await this.ownerSelect.selectOption({ label: ownerName });
    await this.assignOwnerBtn.click();
    await this.page.waitForTimeout(500);
  }

  async getCurrentStatus(): Promise<string | null> {
    const badge = this.page.locator('[class*="badge"], [class*="Badge"]').first();
    if (await badge.isVisible()) {
      return badge.textContent();
    }
    return null;
  }
}
