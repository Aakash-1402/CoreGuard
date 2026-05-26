import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { EventsPage } from './pages/EventsPage';
import { EventDetailPage } from './pages/EventDetailPage';
import { DashboardPage } from './pages/DashboardPage';
import { MANAGER_SCENARIO } from './fixtures/manager.data';
import { USERS, SEVERITIES, EVENT_STATUSES, SOURCES, SEARCH_TERMS, NOTE_CONTENT } from './fixtures/common.data';

test.describe('Manager Scenario', () => {
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
    await loginPage.loginAs(MANAGER_SCENARIO.user.buttonLabel);
    await eventsPage.expectPageLoaded();
  });

  test('manager can log in and access events listing', async () => {
    await eventsPage.expectEventsVisible();
    const count = await eventsPage.getEventCount();
    expect(count).toBeGreaterThan(0);
  });

  test('manager can filter events by severity', async () => {
    await eventsPage.filterBySeverity('critical');
    await eventsPage.expectEventsVisible();
  });

  test('manager can filter events by status', async () => {
    await eventsPage.filterByStatus('new');
    await eventsPage.expectEventsVisible();
  });

  test('manager can filter events by source', async () => {
    await eventsPage.filterBySource('manual');
  });

  test('manager can search events by supplier name', async () => {
    await eventsPage.searchBy(SEARCH_TERMS.supplier);
    await eventsPage.expectEventsVisible();
  });

  test('manager can clear all filters', async () => {
    await eventsPage.filterBySeverity('critical');
    await eventsPage.searchBy(SEARCH_TERMS.supplier);
    await eventsPage.clearAllFilters();
    await eventsPage.expectEventsVisible();
  });

  test('manager can navigate to dashboard and back to events', async () => {
    await eventsPage.navigateToDashboard();
    await dashboardPage.expectPageLoaded();
    await dashboardPage.expectSummaryCardsVisible();
    await dashboardPage.navigateToEvents();
    await eventsPage.expectPageLoaded();
  });

  test('manager can open event detail and see all action buttons including Resolve', async ({ page }) => {
    await eventsPage.filterByStatus('new');
    await eventsPage.clickFirstEvent();
    await eventDetailPage.expectPageLoaded();
    await eventDetailPage.expectActionButtonsVisible(MANAGER_SCENARIO.expectedActionsForNew);
    await eventDetailPage.expectResolveButtonHidden();

    await page.goBack();
    await eventsPage.filterByStatus('reviewed');
    await eventsPage.clickFirstEvent();
    await eventDetailPage.expectPageLoaded();
    await eventDetailPage.expectActionButtonsVisible(MANAGER_SCENARIO.expectedActionsForReviewed);
    await eventDetailPage.expectResolveButtonVisible();
  });

  test('manager can review an event from new to reviewed', async ({ page }) => {
    await eventsPage.filterByStatus('new');
    await eventsPage.clickFirstEvent();
    await eventDetailPage.expectPageLoaded();

    await eventDetailPage.performAction('Review');
    await page.waitForTimeout(1000);

    await eventDetailPage.expectActionButtonsVisible(MANAGER_SCENARIO.expectedActionsForReviewed);
    await eventDetailPage.expectResolveButtonVisible();
  });

  test('manager can resolve an event', async ({ page }) => {
    await eventsPage.filterByStatus('reviewed');
    await eventsPage.clickFirstEvent();
    await eventDetailPage.expectPageLoaded();

    await eventDetailPage.expectResolveButtonVisible();
    await eventDetailPage.performAction('Resolve');
    await page.waitForTimeout(1000);
  });

  test('manager can add a note to an event', async ({ page }) => {
    await eventsPage.filterByStatus('new');
    await eventsPage.clickFirstEvent();
    await eventDetailPage.expectPageLoaded();

    await eventDetailPage.addNote(NOTE_CONTENT);
    await eventDetailPage.expectNoteVisible(NOTE_CONTENT);
  });

  test('manager can see audit timeline and evidence sections', async () => {
    await eventsPage.filterByStatus('new');
    await eventsPage.clickFirstEvent();
    await eventDetailPage.expectPageLoaded();

    await expect(eventDetailPage.auditTimeline).toBeVisible();
    await expect(eventDetailPage.evidenceSection).toBeVisible();
    await expect(eventDetailPage.notesSection).toBeVisible();
  });

  test('manager can paginate through events', async () => {
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

  test('manager can refresh events list', async () => {
    await eventsPage.refresh();
    await eventsPage.expectEventsVisible();
  });

  test('manager sees all mock users on login page', async ({ page }) => {
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

  test('manager can sign out and is redirected to login', async ({ page }) => {
    await page.locator('button', { hasText: 'Sign out' }).click();
    await page.waitForURL(/\/login/);
    await loginPage.expectPageLoaded();
    await expect(page.locator('h1', { hasText: 'CoreGuard' })).toBeVisible();
  });
});
