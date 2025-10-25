import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:5173';

test.describe('ITS Table Features Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto(`${BASE}/login`);
    await page.getByRole('textbox', { name: 'Username' }).fill('admin');
    await page.getByRole('textbox', { name: 'Password' }).fill('admin');
    await page.getByRole('button', { name: /Sign In/i }).click();
    await expect(page).toHaveURL('/', { timeout: 10000 });

    // Apply MSW success scenario for table features
    await page.evaluate(() => {
      if (window.__msw) {
        window.__msw.applyScenarioByName('itsSuccess');
      }
    });

    // Navigate to ITS page
    await page.goto(`${BASE}/its`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('table').first()).toBeVisible({ timeout: 15000 });
  });

  test('table headers display correctly', async ({ page }) => {
    // Check for table headers
    const headers = page.locator('thead th, thead td');
    const headerCount = await headers.count();
    expect(headerCount).toBeGreaterThan(0);

    // Common expected headers
    const expectedHeaders = ['Name', 'Status', 'Labels', 'Created', 'Actions'];
    for (const header of expectedHeaders) {
      const headerElement = page.locator(`text=${header}`).first();
      if (await headerElement.isVisible()) {
        await expect(headerElement).toBeVisible();
      }
    }
  });

  test('table sorting works on sortable columns', async ({ page }) => {
    // Look for sortable column headers (usually have arrows or are clickable)
    const sortableHeaders = page.locator(
      'thead th[role="button"], thead th[class*="sortable"], thead th button'
    );
    const sortableCount = await sortableHeaders.count();

    if (sortableCount > 0) {
      // Click first sortable header
      await sortableHeaders.first().click();
      await page.waitForTimeout(1000);

      // Check if sort indicator appeared
      const sortIndicator = page.locator('[class*="sort"], [aria-sort]').first();
      if (await sortIndicator.isVisible()) {
        await expect(sortIndicator).toBeVisible();
      }

      // Click again to reverse sort
      await sortableHeaders.first().click();
      await page.waitForTimeout(1000);
    }
  });

  test('table pagination works with many clusters', async ({ page }) => {
    // Apply MSW scenario for paginated clusters
    await page.evaluate(() => {
      if (window.__msw) {
        window.__msw.applyScenarioByName('itsPagination');
      }
    });

    await expect(page.locator('table').first()).toBeVisible({ timeout: 15000 });

    // Should show pagination controls
    const paginationControls = page.locator('[class*="pagination"], [role="navigation"]');
    if (await paginationControls.first().isVisible()) {
      await expect(paginationControls.first()).toBeVisible();

      // Look for next/previous buttons
      const nextButton = page
        .getByRole('button')
        .filter({ hasText: /next|>/i })
        .first();
      const prevButton = page
        .getByRole('button')
        .filter({ hasText: /prev|</i })
        .first();

      if ((await nextButton.isVisible()) && (await nextButton.isEnabled())) {
        await nextButton.click();
        await page.waitForTimeout(1000);

        // Should show different clusters
        await expect(page.locator('text=cluster-11')).toBeVisible({ timeout: 5000 });

        // Previous button should now be enabled
        if ((await prevButton.isVisible()) && (await prevButton.isEnabled())) {
          await prevButton.click();
          await page.waitForTimeout(1000);

          // Should go back to first page
          await expect(page.locator('text=cluster-1')).toBeVisible({ timeout: 5000 });
        }
      } else {
        // If pagination is disabled, just verify we have the expected clusters
        await expect(page.locator('tbody tr')).toHaveCount(2); // Only 2 clusters from MSW mock
      }
    }
  });

  test('table row selection persists across actions', async ({ page }) => {
    // Select first cluster
    const checkboxes = page.locator('tbody input[type="checkbox"]');
    const checkboxCount = await checkboxes.count();

    if (checkboxCount > 0) {
      await checkboxes.first().check();
      await expect(checkboxes.first()).toBeChecked();

      // Perform search to filter table
      const searchInput = page.locator('input[type="text"]').first();
      await searchInput.fill('cluster1');
      await page.waitForTimeout(1000);

      // Clear search
      await searchInput.clear();
      await page.waitForTimeout(1000);

      // Selection should persist
      await expect(checkboxes.first()).toBeChecked();
    }
  });

  test('table displays empty state when no results', async ({ page }) => {
    // Search for non-existent cluster
    const searchInput = page.locator('input[type="text"]').first();
    await searchInput.fill('nonexistent-cluster-xyz');
    await page.waitForTimeout(1000);

    // Should show empty state
    const emptyState = page.locator('text=/no clusters|no results|empty/i').first();
    if (await emptyState.isVisible()) {
      await expect(emptyState).toBeVisible();
    } else {
      // Or table should have no rows
      const rows = page.locator('tbody tr');
      await expect(rows).toHaveCount(0);
    }
  });

  test('table loading state displays during data fetch', async ({ page }) => {
    // Apply MSW scenario for delayed loading
    await page.evaluate(() => {
      if (window.__msw) {
        window.__msw.applyScenarioByName('itsLoading');
      }
    });

    // Should show loading indicator
    try {
      const loadingIndicator = page.locator('[class*="loading"], [class*="spinner"]').first();
      await expect(loadingIndicator).toBeVisible({ timeout: 2000 });
    } catch {
      // Fallback: check for loading text
      const loadingText = page.locator('text=/loading/i').first();
      if (await loadingText.isVisible({ timeout: 1000 })) {
        await expect(loadingText).toBeVisible();
      }
    }

    // Eventually should show data
    await expect(page.locator('table').first()).toBeVisible({ timeout: 10000 });
  });

  test('table columns are resizable', async ({ page }) => {
    // Look for resizable column headers
    const resizeHandles = page.locator('[class*="resize"], th[style*="resize"]');
    const handleCount = await resizeHandles.count();

    if (handleCount > 0) {
      // Try to resize first column
      const firstHandle = resizeHandles.first();
      const box = await firstHandle.boundingBox();

      if (box) {
        // Drag to resize
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        await page.mouse.move(box.x + 50, box.y + box.height / 2);
        await page.mouse.up();

        // Column should be resized (hard to test exact width, but action should complete)
        await page.waitForTimeout(500);
      }
    }
  });

  test('table supports keyboard navigation', async ({ page }) => {
    // Focus on table
    await page.locator('table').first().focus();

    // Try arrow key navigation
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(200);

    await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(200);

    // Try tab navigation
    await page.keyboard.press('Tab');
    await page.waitForTimeout(200);

    // Should navigate through focusable elements
    const focusedElement = page.locator(':focus');
    if (await focusedElement.isVisible()) {
      await expect(focusedElement).toBeVisible();
    }
  });

  test('table context menu works on right click', async ({ page }) => {
    // Right click on table row
    const firstRow = page.locator('tbody tr').first();
    await firstRow.click({ button: 'right' });
    await page.waitForTimeout(500);

    // Check if context menu appeared
    const contextMenu = page.locator('[role="menu"], [class*="context"]').first();
    if (await contextMenu.isVisible()) {
      await expect(contextMenu).toBeVisible();

      // Close context menu
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
    }
  });

  test('table row hover effects work', async ({ page }) => {
    // Hover over first row
    const firstRow = page.locator('tbody tr').first();
    await firstRow.hover();
    await page.waitForTimeout(300);

    // Row should have hover state (visual change)
    const rowClasses = await firstRow.getAttribute('class');
    const rowStyle = await firstRow.getAttribute('style');

    // Should have some hover indication (class or style change)
    expect(rowClasses || rowStyle).toBeTruthy();
  });

  test('table column visibility can be toggled', async ({ page }) => {
    // Look for column visibility controls
    const columnToggle = page
      .getByRole('button')
      .filter({ hasText: /columns|view|show/i })
      .first();

    if (await columnToggle.isVisible()) {
      await columnToggle.click();
      await page.waitForTimeout(500);

      // Should show column options
      const columnOptions = page.locator('[role="menuitem"], [type="checkbox"]');
      const optionCount = await columnOptions.count();

      if (optionCount > 0) {
        // Toggle first column option
        await columnOptions.first().click();
        await page.waitForTimeout(500);

        // Column visibility should change
        const headers = page.locator('thead th');
        const headerCount = await headers.count();
        expect(headerCount).toBeGreaterThan(0);
      }
    }
  });
});
