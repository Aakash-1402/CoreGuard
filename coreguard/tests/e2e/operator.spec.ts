import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { EventsPage } from './pages/EventsPage';
import { EventDetailPage } from './pages/EventDetailPage';
import { DashboardPage } from './pages/DashboardPage';
import { OPERATOR_SCENARIO } from './fixtures/operator.data';
import { USERS, SEVERITIES, EVENT_STATUSES, SOURCES, SEARCH_TERMS, NOTE_CONTENT } from './fixtures/common.data';

test.describe('Operator Scenario', () => {
  let loginPage: LoginPage;
  let eventsPage: EventsPage;
  let eventDetailPage: EventDetailPage;
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    eventsPage = new EventsPage(page);
    eventDetailPage = new EventDetailPage(page);
    dashboardPage = new DashboardPage(page);

    await loginPage.goto();
    await loginPage.expectPageLoaded();
    await loginPage.loginAs(OPERATOR_SCENARIO.user.buttonLabel);
    await eventsPage.expectPageLoaded();
  });

  test('operator can log in and access events listing', async () => {
    await eventsPage.expectEventsVisible();
    const count = await eventsPage.getEventCount();
    expect(count).toBeGreaterThan(0);
  });

  test('operator can filter events by severity', async () => {
    await eventsPage.filterBySeverity('high');
    await eventsPage.expectEventsVisible();
  });

  test('operator can filter events by status', async () => {
    await eventsPage.filterByStatus('escalated');
  });

  test('operator can filter events by source', async () => {
    await eventsPage.filterBySource('api');
  });

  test('operator can search events by part name', async () => {
    await eventsPage.searchBy(SEARCH_TERMS.part);
    await eventsPage.expectEventsVisible();
  });

  test('operator can clear all filters', async () => {
    await eventsPage.filterBySeverity('low');
    await eventsPage.searchBy(SEARCH_TERMS.part);
    await eventsPage.clearAllFilters();
    await eventsPage.expectEventsVisible();
  });

  test('operator can navigate to dashboard and back to events', async () => {
    await eventsPage.navigateToDashboard();
    await dashboardPage.expectPageLoaded();
    await dashboardPage.expectSummaryCardsVisible();
    await dashboardPage.navigateToEvents();
    await eventsPage.expectPageLoaded();
  });

  test('operator CANNOT see Resolve button on reviewed event', async ({ page }) => {
    await eventsPage.filterByStatus('reviewed');
    await eventsPage.clickFirstEvent();
    await eventDetailPage.expectPageLoaded();

    await eventDetailPage.expectResolveButtonHidden();
    await eventDetailPage.expectActionButtonsVisible(OPERATOR_SCENARIO.expectedActionsForReviewed);
  });

  test('operator CANNOT see Resolve button on escalated event', async ({ page }) => {
    await eventsPage.filterByStatus('escalated');
    const hasEscalatedEvents = await eventsPage.table.locator('tbody tr').first().isVisible().catch(() => false);
    test.skip(!hasEscalatedEvents, 'No escalated events available in seeded data');

    await eventsPage.clickFirstEvent();
    await eventDetailPage.expectPageLoaded();

    await eventDetailPage.expectResolveButtonHidden();
    await eventDetailPage.expectActionButtonsVisible(OPERATOR_SCENARIO.expectedActionsForEscalated);
  });

  test('operator can review an event from new to reviewed but cannot resolve', async ({ page }) => {
    await eventsPage.filterByStatus('new');
    await eventsPage.clickFirstEvent();
    await eventDetailPage.expectPageLoaded();

    await eventDetailPage.expectActionButtonsVisible(OPERATOR_SCENARIO.expectedActionsForNew);
    await eventDetailPage.expectResolveButtonHidden();

    await eventDetailPage.performAction('Review');
    await page.waitForTimeout(1000);

    await eventDetailPage.expectResolveButtonHidden();
  });

  test('operator can escalate an event', async ({ page }) => {
    await eventsPage.filterByStatus('new');
    await eventsPage.clickFirstEvent();
    await eventDetailPage.expectPageLoaded();

    await eventDetailPage.performAction('Escalate');
    await page.waitForTimeout(1000);

    await eventDetailPage.expectResolveButtonHidden();
  });

  test('operator can add a note to an event', async ({ page }) => {
    await eventsPage.filterByStatus('new');
    await eventsPage.clickFirstEvent();
    await eventDetailPage.expectPageLoaded();

    await eventDetailPage.addNote(NOTE_CONTENT);
    await eventDetailPage.expectNoteVisible(NOTE_CONTENT);
  });

  test('operator can see audit timeline and evidence sections', async () => {
    await eventsPage.filterByStatus('new');
    await eventsPage.clickFirstEvent();
    await eventDetailPage.expectPageLoaded();

    await expect(eventDetailPage.auditTimeline).toBeVisible();
    await expect(eventDetailPage.evidenceSection).toBeVisible();
    await expect(eventDetailPage.notesSection).toBeVisible();
  });

  test('operator can paginate through events', async () => {
    const clearBtnVisible = await eventsPage.clearFiltersBtn.isVisible();
    if (clearBtnVisible) {
      await eventsPage.clearAllFilters();
    }
    const initialCount = await eventsPage.getEventCount();
    if (initialCount > 0) {
      const nextDisabled = await eventsPage.nextBtn.isDisabled();
      if (!nextDisabled) {
        await eventsPage.goToNextPage();
        await eventsPage.expectEventsVisible();
      }
    }
  });

  test('operator can refresh events list', async () => {
    await eventsPage.refresh();
    await eventsPage.expectEventsVisible();
  });

  test('operator sees all mock users on login page', async ({ page }) => {
    await page.locator('button', { hasText: 'Sign out' }).click();
    await page.waitForURL(/\/login/);
    await loginPage.expectPageLoaded();
    await loginPage.expectUserButtons([
      USERS.alice.buttonLabel,
      USERS.bob.buttonLabel,
      USERS.carol.buttonLabel,
      USERS.dan.buttonLabel,
    ]);
  });

  test('operator can sign out and is redirected to login', async ({ page }) => {
    await page.locator('button', { hasText: 'Sign out' }).click();
    await page.waitForURL(/\/login/);
    await loginPage.expectPageLoaded();
    await expect(page.locator('h1', { hasText: 'CoreGuard' })).toBeVisible();
  });
});
