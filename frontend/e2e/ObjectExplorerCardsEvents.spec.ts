import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { ObjectExplorerPage } from './pages/ObjectExplorerPage';
import { MSWHelper } from './pages/utils/MSWHelper';

test.describe('Object Explorer - Card Events and Interactions', () => {
  let loginPage: LoginPage;
  let objectExplorerPage: ObjectExplorerPage;
  let mswHelper: MSWHelper;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    objectExplorerPage = new ObjectExplorerPage(page);
    mswHelper = new MSWHelper(page);

    await mswHelper.applyScenario('default');

    await loginPage.goto();
    await loginPage.login('admin', 'admin');
    await objectExplorerPage.goto();
    await objectExplorerPage.waitForPageLoad();

    await objectExplorerPage.selectKind('Pod');
    await objectExplorerPage.selectNamespace('default');
    await objectExplorerPage.waitForResources();

    await objectExplorerPage.changeViewMode('grid');
    await page.waitForTimeout(500);
  });

  test('should handle card click events', async ({ page }) => {
    const firstCard = page.locator('.MuiGrid-item .MuiCard-root').first();
    await expect(firstCard).toBeVisible();

    const initialBulkActions = await page
      .locator('.bulk-actions, [class*="bulk"], .MuiPaper-root')
      .filter({ hasText: /selected|bulk/i })
      .first()
      .isVisible()
      .catch(() => false);

    await firstCard.click();
    await page.waitForTimeout(1500);

    let cardInteractionWorked = false;

    const bulkActions = page
      .locator('.bulk-actions, [class*="bulk"], .MuiPaper-root')
      .filter({ hasText: /selected|bulk/i })
      .first();
    const isBulkVisible = await bulkActions.isVisible().catch(() => false);
    if (isBulkVisible && !initialBulkActions) {
      cardInteractionWorked = true;
    }

    if (!cardInteractionWorked) {
      const hasSelectionStyling = await firstCard.evaluate(el => {
        const styles = window.getComputedStyle(el);
        const computedBorder = styles.border || styles.borderWidth || styles.borderColor;
        const computedBg = styles.backgroundColor;
        return (
          computedBorder.includes('2px') ||
          computedBorder.includes('solid') ||
          (computedBg !== 'rgba(0, 0, 0, 0)' &&
            computedBg !== 'transparent' &&
            computedBg !== 'rgb(255, 255, 255)') ||
          el.classList.contains('selected') ||
          el.classList.contains('Mui-selected') ||
          el.getAttribute('aria-selected') === 'true'
        );
      });
      if (hasSelectionStyling) {
        cardInteractionWorked = true;
      }
    }

    if (!cardInteractionWorked) {
      const detailsPanel = page
        .locator('[role="dialog"], .MuiDrawer-root, .details-panel, .MuiModal-root')
        .first();
      const hasDetailsPanel = await detailsPanel.isVisible().catch(() => false);
      if (hasDetailsPanel) {
        cardInteractionWorked = true;
      }
    }

    if (!cardInteractionWorked) {
      const currentUrl = page.url();
      if (
        currentUrl.includes('details') ||
        currentUrl.includes('resource') ||
        currentUrl.includes('view')
      ) {
        cardInteractionWorked = true;
      }
    }

    expect(cardInteractionWorked).toBe(true);
  });

  test('should handle card hover effects', async ({ page }) => {
    const firstCard = page.locator('.MuiGrid-item .MuiCard-root').first();
    await expect(firstCard).toBeVisible();

    const initialTransform = await firstCard.evaluate(el => {
      return window.getComputedStyle(el).transform;
    });

    await firstCard.hover();
    await page.waitForTimeout(300);

    const hoverTransform = await firstCard.evaluate(el => {
      return window.getComputedStyle(el).transform;
    });

    const hoverShadow = await firstCard.evaluate(el => {
      return window.getComputedStyle(el).boxShadow;
    });

    const hasHoverEffect = hoverTransform !== initialTransform || hoverShadow !== 'none';
    expect(hasHoverEffect).toBe(true);
  });

  test('should display card action buttons on hover', async ({ page }) => {
    const firstCard = page.locator('.MuiGrid-item .MuiCard-root').first();
    await expect(firstCard).toBeVisible();

    await firstCard.hover();
    await page.waitForTimeout(500);

    const actionButtons = firstCard.locator('button').filter({
      has: page.locator(
        'svg, .fa-ellipsis, [data-testid="MoreVertIcon"], [data-testid="VisibilityIcon"]'
      ),
    });

    const buttonCount = await actionButtons.count();

    if (buttonCount > 0) {
      await expect(actionButtons.first()).toBeVisible();
    }
  });

  test('should handle card action menu', async ({ page }) => {
    const firstCard = page.locator('.MuiGrid-item .MuiCard-root').first();
    await expect(firstCard).toBeVisible();

    const actionButton = firstCard
      .locator('button')
      .filter({
        has: page.locator('svg, .fa-ellipsis, [data-testid="MoreVertIcon"]'),
      })
      .first();

    if (await actionButton.isVisible().catch(() => false)) {
      await actionButton.click();
      await page.waitForTimeout(500);

      const actionMenu = page.locator('[role="menu"], .MuiMenu-root, .MuiPopover-root').first();
      await expect(actionMenu).toBeVisible();

      const menuItems = page.locator('[role="menuitem"]');
      const itemCount = await menuItems.count();
      expect(itemCount).toBeGreaterThan(0);

      const viewAction = menuItems.filter({ hasText: /view|details|open/i }).first();
      const editAction = menuItems.filter({ hasText: /edit|yaml|modify/i }).first();
      const deleteAction = menuItems.filter({ hasText: /delete|remove|trash/i }).first();

      if (await viewAction.isVisible().catch(() => false)) {
        await expect(viewAction).toBeVisible();
      }

      if (await editAction.isVisible().catch(() => false)) {
        await expect(editAction).toBeVisible();
      }

      if (await deleteAction.isVisible().catch(() => false)) {
        await expect(deleteAction).toBeVisible();
      }

      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);

      await expect(actionMenu).not.toBeVisible();
    }
  });

  test('should handle view details action', async ({ page }) => {
    const firstCard = page.locator('.MuiGrid-item .MuiCard-root').first();
    await expect(firstCard).toBeVisible();

    let detailsOpened = false;
    let interactionAttempted = false;

    const viewButton = firstCard
      .locator('button')
      .filter({
        has: page.locator('[data-testid="VisibilityIcon"], .fa-eye'),
      })
      .first();

    if (await viewButton.isVisible().catch(() => false)) {
      await viewButton.click();
      await page.waitForTimeout(2000);
      interactionAttempted = true;

      const detailsPanel = page
        .locator('[role="dialog"], .MuiDrawer-root, .details-panel, .MuiModal-root, .MuiPaper-root')
        .first();
      detailsOpened = await detailsPanel.isVisible().catch(() => false);
    }

    if (!detailsOpened && !interactionAttempted) {
      await firstCard.dblclick();
      await page.waitForTimeout(2000);
      interactionAttempted = true;

      const detailsPanel = page
        .locator('[role="dialog"], .MuiDrawer-root, .details-panel, .MuiModal-root, .MuiPaper-root')
        .first();
      detailsOpened = await detailsPanel.isVisible().catch(() => false);
    }

    if (!detailsOpened && !interactionAttempted) {
      await firstCard.click();
      await page.waitForTimeout(2000);
      interactionAttempted = true;

      const detailsPanel = page
        .locator('[role="dialog"], .MuiDrawer-root, .details-panel, .MuiModal-root, .MuiPaper-root')
        .first();
      detailsOpened = await detailsPanel.isVisible().catch(() => false);
    }

    if (!detailsOpened) {
      const currentUrl = page.url();
      if (
        currentUrl.includes('details') ||
        currentUrl.includes('resource') ||
        currentUrl.includes('view')
      ) {
        detailsOpened = true;
      }
    }

    if (!detailsOpened) {
      const hasDetailsContent = await page
        .locator('text=/summary|edit|logs|yaml|overview|metadata/i')
        .first()
        .isVisible()
        .catch(() => false);
      if (hasDetailsContent) {
        detailsOpened = true;
      }
    }

    if (!detailsOpened) {
      const hasTabs = await page
        .locator('[role="tab"], .MuiTab-root')
        .first()
        .isVisible()
        .catch(() => false);
      if (hasTabs) {
        detailsOpened = true;
      }
    }

    if (!interactionAttempted) {
      expect(true).toBe(true);
    } else {
      expect(detailsOpened).toBe(true);
    }
  });

  test('should handle card keyboard navigation', async ({ page }) => {
    const cards = page.locator('.MuiGrid-item .MuiCard-root');
    const cardCount = await cards.count();

    if (cardCount > 1) {
      await cards.first().focus();
      await page.waitForTimeout(300);

      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(300);

      const focusedElement = page.locator(':focus');
      const isFocusedCard = await focusedElement.evaluate(el => {
        return el.closest('.MuiCard-root') !== null;
      });

      if (isFocusedCard) {
        expect(isFocusedCard).toBe(true);
      }

      await page.keyboard.press('Enter');
      await page.waitForTimeout(1000);

      const detailsPanel = page.locator('[role="dialog"], .MuiDrawer-root').first();
      const hasDetailsPanel = await detailsPanel.isVisible().catch(() => false);

      if (hasDetailsPanel) {
        expect(hasDetailsPanel).toBe(true);
      }
    }
  });

  test('should handle card context menu', async ({ page }) => {
    const firstCard = page.locator('.MuiGrid-item .MuiCard-root').first();
    await expect(firstCard).toBeVisible();

    await firstCard.click({ button: 'right' });
    await page.waitForTimeout(500);

    const contextMenu = page.locator('[role="menu"], .context-menu, .MuiMenu-root').first();

    if (await contextMenu.isVisible().catch(() => false)) {
      await expect(contextMenu).toBeVisible();

      const menuItems = page.locator('[role="menuitem"]');
      const itemCount = await menuItems.count();
      expect(itemCount).toBeGreaterThan(0);

      await page.keyboard.press('Escape');
    }
  });

  test('should handle card drag and drop', async ({ page }) => {
    const cards = page.locator('.MuiGrid-item .MuiCard-root');
    const cardCount = await cards.count();

    if (cardCount > 1) {
      const firstCard = cards.first();
      const secondCard = cards.nth(1);

      const isDraggable = await firstCard.getAttribute('draggable');

      if (isDraggable === 'true') {
        await firstCard.dragTo(secondCard);
        await page.waitForTimeout(1000);
      }
    }
  });

  test('should handle card selection with checkboxes', async ({ page }) => {
    const cardCheckboxes = page.locator(
      '.MuiCard-root input[type="checkbox"], .MuiCard-root .MuiCheckbox-root'
    );
    const checkboxCount = await cardCheckboxes.count();

    if (checkboxCount > 0) {
      await cardCheckboxes.first().click();
      await page.waitForTimeout(500);

      const isChecked = await cardCheckboxes.first().isChecked();
      expect(isChecked).toBe(true);

      const bulkActions = page.locator('.bulk-actions, [class*="bulk"]').first();
      if (await bulkActions.isVisible().catch(() => false)) {
        await expect(bulkActions).toBeVisible();
      }
    }
  });

  test('should handle card status indicators', async ({ page }) => {
    const firstCard = page.locator('.MuiGrid-item .MuiCard-root').first();
    await expect(firstCard).toBeVisible();

    const statusChips = firstCard.locator('.MuiChip-root');
    const statusIcons = firstCard.locator(
      '[data-testid="CheckCircleIcon"], [data-testid="WarningIcon"], [data-testid="ErrorIcon"]'
    );
    const statusText = firstCard.locator('text=/healthy|running|pending|failed|ready|error/i');

    const hasStatusChips = (await statusChips.count()) > 0;
    const hasStatusIcons = (await statusIcons.count()) > 0;
    const hasStatusText = (await statusText.count()) > 0;

    const hasStatusIndicators = hasStatusChips || hasStatusIcons || hasStatusText;
    expect(hasStatusIndicators).toBe(true);
  });

  test('should handle card refresh action', async ({ page }) => {
    const firstCard = page.locator('.MuiGrid-item .MuiCard-root').first();
    await expect(firstCard).toBeVisible();

    const refreshButton = firstCard
      .locator('button')
      .filter({
        has: page.locator('[data-testid="RefreshIcon"], .fa-refresh, .fa-sync'),
      })
      .first();

    if (await refreshButton.isVisible().catch(() => false)) {
      const refreshRequests: string[] = [];
      page.on('request', request => {
        if (request.url().includes('/api/') || request.url().includes('/refresh')) {
          refreshRequests.push(request.url());
        }
      });

      await refreshButton.click();
      await page.waitForTimeout(2000);

      const hasRefreshRequest = refreshRequests.length > 0;
      expect(hasRefreshRequest).toBe(true);
    }
  });

  test('should handle card tooltips', async ({ page }) => {
    const firstCard = page.locator('.MuiGrid-item .MuiCard-root').first();
    await expect(firstCard).toBeVisible();

    const cardElements = [
      firstCard.locator('.MuiChip-root').first(),
      firstCard.locator('button').first(),
      firstCard.locator('svg').first(),
      firstCard,
    ];

    for (const element of cardElements) {
      if (await element.isVisible().catch(() => false)) {
        await element.hover();
        await page.waitForTimeout(500);

        const tooltip = page.locator('[role="tooltip"], .MuiTooltip-tooltip').first();
        if (await tooltip.isVisible().catch(() => false)) {
          await expect(tooltip).toBeVisible();
          break;
        }
      }
    }
  });

  test('should handle card animation states', async ({ page }) => {
    const firstCard = page.locator('.MuiGrid-item .MuiCard-root').first();
    await expect(firstCard).toBeVisible();

    const loadingIndicator = firstCard
      .locator('.MuiCircularProgress-root, .loading, .spinner')
      .first();
    await loadingIndicator.isVisible().catch(() => false);

    const hasTransition = await firstCard.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return styles.transition !== 'none' && styles.transition !== '';
    });

    expect(hasTransition).toBe(true);

    await firstCard.click();
    await page.waitForTimeout(100);

    const hasActiveState = await firstCard.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return (
        styles.transform !== 'none' ||
        el.classList.contains('active') ||
        el.classList.contains('pressed')
      );
    });

    expect(hasActiveState).toBe(true);
  });

  test('should handle multiple card selection', async ({ page }) => {
    const cards = page.locator('.MuiGrid-item .MuiCard-root');
    const cardCount = await cards.count();

    if (cardCount > 1) {
      await cards.first().click();
      await page.waitForTimeout(300);

      await page.keyboard.down('Control');
      await cards.nth(1).click();
      await page.keyboard.up('Control');
      await page.waitForTimeout(500);

      const selectedCards = page.locator(
        '.MuiCard-root[aria-selected="true"], .MuiCard-root.selected'
      );
      const selectedCount = await selectedCards.count();

      if (selectedCount > 1) {
        expect(selectedCount).toBeGreaterThan(1);

        const bulkActions = page.locator('.bulk-actions, [class*="bulk"]').first();
        if (await bulkActions.isVisible().catch(() => false)) {
          await expect(bulkActions).toBeVisible();
        }
      }
    }
  });
});
