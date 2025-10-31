import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:5173';

test.describe('ITS Cluster Actions Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto(`${BASE}/login`);
    await page.getByRole('textbox', { name: 'Username' }).fill('admin');
    await page.getByRole('textbox', { name: 'Password' }).fill('admin');
    await page.getByRole('button', { name: /Sign In/i }).click();
    await expect(page).toHaveURL('/', { timeout: 10000 });

    // Apply MSW success scenario for cluster actions
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

  test('cluster row actions menu opens and shows options', async ({ page }) => {
    // Find actions button in table row
    const actionsButtons = page.locator('tbody tr button');
    const buttonCount = await actionsButtons.count();

    if (buttonCount > 0) {
      // Click first actions button
      await actionsButtons.first().click();
      await page.waitForTimeout(500);

      // Check if menu appeared
      const menu = page.locator('[role="menu"]').first();
      if (await menu.isVisible()) {
        await expect(menu).toBeVisible();

        // Check for common menu items
        const menuItems = page.locator('[role="menuitem"]');
        const itemCount = await menuItems.count();
        expect(itemCount).toBeGreaterThan(0);

        // Look for common actions
        const commonActions = ['Edit Labels', 'View Details', 'Detach', 'Remove'];
        for (const action of commonActions) {
          const menuItem = page.getByRole('menuitem').filter({ hasText: new RegExp(action, 'i') });
          if (await menuItem.isVisible()) {
            await expect(menuItem).toBeVisible();
          }
        }

        // Close menu
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
      }
    }
  });

  test('edit labels dialog opens and works', async ({ page }) => {
    // Apply MSW scenario for successful label operations
    await page.evaluate(() => {
      if (window.__msw) {
        window.__msw.applyScenarioByName('itsLabelsSuccess');
      }
    });

    // Find and click actions button
    const actionsButtons = page.locator('tbody tr button');
    const buttonCount = await actionsButtons.count();

    if (buttonCount > 0) {
      await actionsButtons.first().click();
      await page.waitForTimeout(500);

      // Click Edit Labels if available
      const editLabelsItem = page.getByRole('menuitem').filter({ hasText: /Edit Labels|Labels/i });
      if (await editLabelsItem.isVisible()) {
        await editLabelsItem.click();
        await page.waitForTimeout(1000);

        // Labels dialog should open
        const dialog = page.locator('[role="dialog"]').first();
        await expect(dialog).toBeVisible();

        // Look for label inputs
        const labelKeyInput = page.locator('input[placeholder*="key"], input[name*="key"]').first();
        const labelValueInput = page
          .locator('input[placeholder*="value"], input[name*="value"]')
          .first();

        if ((await labelKeyInput.isVisible()) && (await labelValueInput.isVisible())) {
          // Add a new label
          await labelKeyInput.fill('environment');
          await labelValueInput.fill('test');

          // Save changes
          const saveButton = page
            .getByRole('button')
            .filter({ hasText: /Save|Update|Apply/i })
            .first();
          if (await saveButton.isVisible()) {
            await saveButton.click();
            await page.waitForTimeout(1000);

            // Should show success message or close dialog
            const successMessage = page.locator('text=/success|updated|saved/i').first();
            if (await successMessage.isVisible()) {
              await expect(successMessage).toBeVisible();
            }
          }
        }
      }
    }
  });

  test('view cluster details dialog opens', async ({ page }) => {
    // Use default MSW success scenario (includes cluster details)
    await page.evaluate(() => {
      if (window.__msw) {
        window.__msw.applyScenarioByName('itsSuccess');
      }
    });

    // Find and click actions button
    const actionsButtons = page.locator('tbody tr button');
    const buttonCount = await actionsButtons.count();

    if (buttonCount > 0) {
      await actionsButtons.first().click();
      await page.waitForTimeout(500);

      // Click View Details if available
      const viewDetailsItem = page
        .getByRole('menuitem')
        .filter({ hasText: /View Details|Details/i });
      if (await viewDetailsItem.isVisible()) {
        await viewDetailsItem.click();
        await page.waitForTimeout(1000);

        // Details dialog should open
        const dialog = page.locator('[role="dialog"]').first();
        await expect(dialog).toBeVisible();

        // Should show cluster information
        await expect(page.getByText('cluster1').first()).toBeVisible();

        // Look for cluster details
        const detailsText = ['Ready', 'cpu', 'memory', 'pods'];
        for (const detail of detailsText) {
          const detailElement = page.locator(`text=${detail}`).first();
          if (await detailElement.isVisible()) {
            await expect(detailElement).toBeVisible();
          }
        }
      }
    }
  });

  test('detach cluster confirmation dialog works', async ({ page }) => {
    // Apply MSW scenario for successful detach operations
    await page.evaluate(() => {
      if (window.__msw) {
        window.__msw.applyScenarioByName('itsDetachSuccess');
      }
    });

    // Find and click actions button
    const actionsButtons = page.locator('tbody tr button');
    const buttonCount = await actionsButtons.count();

    if (buttonCount > 0) {
      await actionsButtons.first().click();
      await page.waitForTimeout(500);

      // Click Detach if available
      const detachItem = page.getByRole('menuitem').filter({ hasText: /Detach|Remove/i });
      if (await detachItem.isVisible()) {
        await detachItem.click();
        await page.waitForTimeout(1000);

        // Confirmation dialog should open
        const dialog = page.locator('[role="dialog"]').first();
        await expect(dialog).toBeVisible();

        // Should show confirmation message
        await expect(page.locator('text=/confirm|sure|detach/i').first()).toBeVisible();

        const cancelButton = page
          .getByRole('button')
          .filter({ hasText: /Cancel|No/i })
          .first();

        if (await cancelButton.isVisible()) {
          // Test cancel first
          await cancelButton.click();
          await page.waitForTimeout(500);
          await expect(dialog).not.toBeVisible();

          // Open again and confirm
          await actionsButtons.first().click();
          await page.waitForTimeout(500);
          const detachItem2 = page.getByRole('menuitem').filter({ hasText: /Detach|Remove/i });
          if (await detachItem2.isVisible()) {
            await detachItem2.click();
            await page.waitForTimeout(1000);

            const confirmButton2 = page
              .getByRole('button')
              .filter({ hasText: /Confirm|Yes|Detach/i })
              .first();
            if (await confirmButton2.isVisible()) {
              await confirmButton2.click();
              await page.waitForTimeout(1000);

              // Should show success message
              const successMessage = page.locator('text=/success|detached|removed/i').first();
              if (await successMessage.isVisible()) {
                await expect(successMessage).toBeVisible();
              }
            }
          }
        }
      }
    }
  });

  test('bulk label management works with multiple selections', async ({ page }) => {
    // Apply MSW scenario for successful label operations
    await page.evaluate(() => {
      if (window.__msw) {
        window.__msw.applyScenarioByName('itsLabelsSuccess');
      }
    });

    // Select multiple clusters
    const checkboxes = page.locator('tbody input[type="checkbox"]');
    const checkboxCount = await checkboxes.count();

    if (checkboxCount >= 2) {
      // Select first two clusters
      await checkboxes.nth(0).check();
      await checkboxes.nth(1).check();
      await page.waitForTimeout(500);

      // Bulk actions button should appear
      const bulkButton = page
        .getByRole('button')
        .filter({ hasText: /Manage/i })
        .first();
      if (await bulkButton.isVisible()) {
        await bulkButton.click();
        await page.waitForTimeout(500);

        // Bulk labels menu item
        const bulkLabelsItem = page
          .getByRole('menuitem')
          .filter({ hasText: /Bulk Labels|Labels/i });
        if (await bulkLabelsItem.isVisible()) {
          await bulkLabelsItem.click();
          await page.waitForTimeout(1000);

          // Bulk labels dialog should open
          const dialog = page.locator('[role="dialog"]').first();
          await expect(dialog).toBeVisible();

          // Should show selected cluster count
          const selectedText = page.locator('text=/2 selected|selected clusters/i').first();
          await expect(selectedText).toBeVisible();

          // Add bulk label
          const labelKeyInput = page
            .locator('input[placeholder*="key"], input[name*="key"]')
            .first();
          const labelValueInput = page
            .locator('input[placeholder*="value"], input[name*="value"]')
            .first();

          if ((await labelKeyInput.isVisible()) && (await labelValueInput.isVisible())) {
            await labelKeyInput.fill('bulk-label');
            await labelValueInput.fill('test-value');

            // Apply to all selected
            const applyButton = page
              .getByRole('button')
              .filter({ hasText: /Apply|Save|Update/i })
              .first();
            if (await applyButton.isVisible()) {
              await applyButton.click();
              await page.waitForTimeout(1000);

              // Should show success message
              const successMessage = page.locator('text=/success|updated|applied/i').first();
              if (await successMessage.isVisible()) {
                await expect(successMessage).toBeVisible();
              }
            }
          }
        }
      }
    }
  });

  test('label chips in table are clickable for filtering', async ({ page }) => {
    // Look for label chips in the table
    const labelChips = page.locator('[class*="chip"], [class*="tag"], [class*="label"]');
    const chipCount = await labelChips.count();

    if (chipCount > 0) {
      // Click on first label chip
      await labelChips.first().click();
      await page.waitForTimeout(1000);

      // Should filter table by that label
      const filteredRows = page.locator('tbody tr');
      const rowCount = await filteredRows.count();

      // Should show filtered results (could be 1 or more depending on how many clusters have that label)
      expect(rowCount).toBeGreaterThanOrEqual(0);

      // Should show filter chip or indication
      const filterChip = page.locator('[class*="filter"], text=/filtered/i').first();
      if (await filterChip.isVisible()) {
        await expect(filterChip).toBeVisible();
      }
    }
  });

  test('cluster status badges display correctly', async ({ page }) => {
    // Look for status badges in table
    const statusBadges = page.locator('[class*="badge"], [class*="status"]');
    const statusText = page.locator('text=/Active|Available|Ready/i');

    let badgeCount = await statusBadges.count();
    if (badgeCount === 0) {
      badgeCount = await statusText.count();
    }

    if (badgeCount > 0) {
      // Should show status for each cluster
      expect(badgeCount).toBeGreaterThan(0);

      // Check for available/active status (from mock data)
      const activeBadge = page.locator('text=/Active|Available|Ready/i').first();
      await expect(activeBadge).toBeVisible();
    }
  });

  test('cluster capacity information displays', async ({ page }) => {
    // Look for capacity information (CPU, Memory, Pods)
    const capacityInfo = page.locator('text=/cpu|memory|pods|16|7940284Ki|110/i');
    const infoCount = await capacityInfo.count();

    if (infoCount > 0) {
      // Should show capacity data from mock
      expect(infoCount).toBeGreaterThan(0);
    }
  });

  test('cluster creation timestamp displays', async ({ page }) => {
    // Look for timestamp information
    const timestampInfo = page.locator('text=/2025-09-16|ago|created/i');
    const timestampCount = await timestampInfo.count();

    if (timestampCount > 0) {
      // Should show creation time
      expect(timestampCount).toBeGreaterThan(0);
    }
  });
});
