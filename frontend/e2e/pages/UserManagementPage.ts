import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base/BasePage';

/**
 * User Management Page Object Model
 * Encapsulates all interactions with the user management page
 */
export class UserManagementPage extends BasePage {
  // Main page elements
  readonly pageHeading: Locator;
  readonly addUserButton: Locator;
  readonly searchInput: Locator;
  readonly filterButton: Locator;
  readonly refreshButton: Locator;
  readonly userTable: Locator;
  readonly loadingSpinner: Locator;

  // Filter elements
  readonly filterPanel: Locator;
  readonly roleFilter: Locator;
  readonly permissionFilter: Locator;
  readonly permissionLevelFilter: Locator;
  readonly sortByFilter: Locator;
  readonly sortDirectionButton: Locator;
  readonly clearFiltersButton: Locator;
  readonly closeFiltersButton: Locator;

  // User list elements
  readonly userRows: Locator;
  readonly emptyState: Locator;

  // Modal elements
  readonly modal: Locator;
  readonly modalTitle: Locator;
  readonly modalCloseButton: Locator;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly adminCheckbox: Locator;
  readonly submitButton: Locator;
  readonly cancelButton: Locator;

  // Delete modal elements
  readonly deleteModal: Locator;
  readonly deleteConfirmButton: Locator;
  readonly deleteCancelButton: Locator;

  // Toast notifications
  readonly successToast: Locator;
  readonly errorToast: Locator;

  constructor(page: Page) {
    super(page);

    // Main page elements
    this.pageHeading = page.getByTestId('user-management-title');
    this.addUserButton = page.getByTestId('add-user-button');
    this.searchInput = page.getByTestId('user-search-input');
    this.filterButton = page.getByTestId('filter-toggle-button');
    this.refreshButton = page.getByTestId('refresh-users-button');
    this.userTable = page.getByTestId('user-table');
    this.loadingSpinner = page.locator('[data-testid="loading"], .loading, .spinner');

    // Filter elements
    this.filterPanel = page.getByTestId('filter-panel');
    this.roleFilter = page.getByTestId('role-filter');
    this.permissionFilter = page.getByTestId('permission-filter');
    this.permissionLevelFilter = page.getByTestId('permission-level-filter');
    this.sortByFilter = page.getByTestId('sort-by-filter');
    this.sortDirectionButton = page.getByTestId('sort-direction-button');
    this.clearFiltersButton = page.getByRole('button', { name: /Reset/i });
    this.closeFiltersButton = page.getByRole('button', { name: /Close Filters|Filters/i }).first();

    // User list elements
    this.userRows = page.locator('[data-testid="user-row"]');
    this.emptyState = page.getByText(/No users/i);

    // Modal elements
    this.modal = page.getByTestId('user-form-modal');
    this.modalTitle = this.modal.locator('h3, h2');
    this.modalCloseButton = this.modal.locator('button[aria-label="Close"]');
    this.usernameInput = this.modal.locator('input#username');
    this.passwordInput = this.modal.locator('input#password');
    this.confirmPasswordInput = this.modal.locator('input#confirmPassword');
    this.adminCheckbox = this.modal.locator('input#isAdmin');
    this.submitButton = this.modal.locator('button[type="submit"]');
    this.cancelButton = this.modal.locator('button:has-text("Cancel")');

    // Delete modal elements
    this.deleteModal = page.locator('[data-testid="delete-user-modal"]');
    this.deleteConfirmButton = this.deleteModal.locator('button:has-text("Delete")');
    this.deleteCancelButton = this.deleteModal.locator('button:has-text("Cancel")');

    // Toast notifications
    this.successToast = page.locator('.toast-success, [role="status"]:has-text("success")').first();
    this.errorToast = page.locator('.toast-error, [role="alert"]').first();
  }

  /**
   * Navigate to user management page
   */
  async goto() {
    await super.goto('/admin/users');
    await this.waitForPageLoad();
  }

  /**
   * Wait for page to load
   */
  async waitForPageLoad() {
    await this.page.waitForLoadState('domcontentloaded');
    // Wait for table rows or empty state
    await Promise.race([
      this.userRows.first().waitFor({ state: 'visible', timeout: 10000 }).catch(() => {}),
      this.emptyState.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {}),
      this.userTable.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {}),
    ]);
  }

  /**
   * Search for users
   */
  async searchUsers(searchTerm: string) {
    await this.searchInput.fill(searchTerm);
    await this.page.waitForTimeout(500); // Wait for debounce
  }

  /**
   * Clear search
   */
  async clearSearch() {
    await this.searchInput.clear();
    await this.page.waitForTimeout(500);
  }

  /**
   * Click add user button
   */
  async clickAddUser() {
    await this.addUserButton.click();
    await this.modal.waitFor({ state: 'visible' });
  }

  /**
   * Click refresh button
   */
  async clickRefresh() {
    await this.refreshButton.click();
  }

  /**
   * Open filters panel
   */
  async openFilters() {
    const isVisible = await this.filterPanel.isVisible().catch(() => false);
    if (!isVisible) {
      await this.filterButton.click();
      await this.filterPanel.waitFor({ state: 'visible' });
    }
  }

  /**
   * Close filters panel
   */
  async closeFilters() {
    const isVisible = await this.filterPanel.isVisible().catch(() => false);
    if (isVisible) {
      await this.filterButton.click();
      await this.filterPanel.waitFor({ state: 'hidden' }).catch(() => {});
    }
  }

  /**
   * Set role filter
   */
  async setRoleFilter(role: 'all' | 'admin' | 'user') {
    await this.openFilters();
    await this.roleFilter.click();
    await this.page.getByText(role, { exact: true }).click();
  }

  /**
   * Clear all filters
   */
  async clearFilters() {
    await this.openFilters();
    await this.clearFiltersButton.click();
  }

  /**
   * Fill user form
   */
  async fillUserForm(data: {
    username: string;
    password?: string;
    confirmPassword?: string;
    isAdmin?: boolean;
  }) {
    await this.usernameInput.fill(data.username);
    
    if (data.password) {
      await this.passwordInput.fill(data.password);
    }
    
    if (data.confirmPassword) {
      await this.confirmPasswordInput.fill(data.confirmPassword);
    }
    
    if (data.isAdmin !== undefined) {
      const isChecked = await this.adminCheckbox.isChecked();
      if (isChecked !== data.isAdmin) {
        await this.adminCheckbox.click();
      }
    }
  }

  /**
   * Submit user form
   */
  async submitUserForm() {
    await this.submitButton.click();
    await this.modal.waitFor({ state: 'hidden', timeout: 10000 });
  }

  /**
   * Cancel user form
   */
  async cancelUserForm() {
    await this.cancelButton.click();
    await this.modal.waitFor({ state: 'hidden' });
  }

  /**
   * Add a new user
   */
  async addUser(data: {
    username: string;
    password: string;
    confirmPassword: string;
    isAdmin?: boolean;
  }) {
    await this.clickAddUser();
    await this.fillUserForm(data);
    await this.submitUserForm();
  }

  /**
   * Get user row by username
   */
  getUserRow(username: string): Locator {
    return this.page.locator(`[data-testid="user-row"][data-username="${username}"]`);
  }

  /**
   * Click edit button for a user
   */
  async clickEditUser(username: string) {
    const userRow = this.getUserRow(username);
    await userRow.getByRole('button', { name: /Edit/i }).click();
    await this.modal.waitFor({ state: 'visible' });
  }

  /**
   * Click delete button for a user
   */
  async clickDeleteUser(username: string) {
    const userRow = this.getUserRow(username);
    await userRow.getByRole('button', { name: /Delete/i }).click();
    await this.deleteModal.waitFor({ state: 'visible' });
  }

  /**
   * Confirm delete user
   */
  async confirmDeleteUser() {
    await this.deleteConfirmButton.click();
    await this.deleteModal.waitFor({ state: 'hidden', timeout: 10000 });
  }

  /**
   * Cancel delete user
   */
  async cancelDeleteUser() {
    await this.deleteCancelButton.click();
    await this.deleteModal.waitFor({ state: 'hidden' });
  }

  /**
   * Delete a user
   */
  async deleteUser(username: string) {
    await this.clickDeleteUser(username);
    await this.confirmDeleteUser();
  }

  /**
   * Edit a user
   */
  async editUser(username: string, data: {
    username?: string;
    password?: string;
    confirmPassword?: string;
    isAdmin?: boolean;
  }) {
    await this.clickEditUser(username);
    await this.fillUserForm({
      username: data.username || username,
      password: data.password,
      confirmPassword: data.confirmPassword,
      isAdmin: data.isAdmin,
    });
    await this.submitUserForm();
  }

  /**
   * Check if user exists in the list
   */
  async userExists(username: string): Promise<boolean> {
    try {
      await this.getUserRow(username).waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get user count
   */
  async getUserCount(): Promise<number> {
    const rows = await this.userRows.count();
    return rows;
  }

  /**
   * Wait for success toast
   */
  async waitForSuccessToast(timeout: number = 5000) {
    await this.successToast.waitFor({ state: 'visible', timeout });
  }

  /**
   * Wait for error toast
   */
  async waitForErrorToast(timeout: number = 5000) {
    await this.errorToast.waitFor({ state: 'visible', timeout });
  }

  /**
   * Check if loading
   */
  async isLoading(): Promise<boolean> {
    return await this.loadingSpinner.isVisible().catch(() => false);
  }

  /**
   * Wait for loading to finish
   */
  async waitForLoadingToFinish(timeout: number = 10000) {
    await this.loadingSpinner.waitFor({ state: 'hidden', timeout }).catch(() => {});
  }

  /**
   * Get all visible usernames
   */
  async getVisibleUsernames(): Promise<string[]> {
    const rows = await this.userRows.all();
    const usernames: string[] = [];
    
    for (const row of rows) {
      const text = await row.textContent();
      if (text) {
        // Extract username from row text (assuming it's the first column)
        const match = text.match(/^(\w+)/);
        if (match) {
          usernames.push(match[1]);
        }
      }
    }
    
    return usernames;
  }

  /**
   * Verify user has admin badge
   */
  async verifyUserIsAdmin(username: string) {
    const userRow = this.getUserRow(username);
    await expect(userRow.locator('[data-testid="user-role-badge"]')).toContainText(/admin/i);
  }

  /**
   * Verify user does not have admin badge
   */
  async verifyUserIsNotAdmin(username: string) {
    const userRow = this.getUserRow(username);
    const roleBadges = userRow.locator('[data-testid="user-role-badge"]');
    await expect(roleBadges).not.toContainText(/admin/i);
  }

  /**
   * Set permission for a component
   */
  async setPermission(component: string, level: 'read' | 'write') {
    // This assumes the modal is already open
    const permissionContainer = this.modal.locator(`[data-component="${component}"]`);
    await permissionContainer.waitFor({ state: 'visible', timeout: 5000 });

    const option = permissionContainer.locator(`input[data-permission-level="${level}"]`);
    await option.waitFor({ state: 'visible', timeout: 5000 });
    await option.scrollIntoViewIfNeeded();
    await option.check({ force: true });
  }

  /**
   * Verify page elements are visible
   */
  async verifyPageElements() {
    await expect(this.pageHeading).toBeVisible();
    await expect(this.addUserButton).toBeVisible();
    await expect(this.searchInput).toBeVisible();
    await expect(this.filterButton).toBeVisible();
    await expect(this.refreshButton).toBeVisible();
  }

  /**
   * Verify empty state
   */
  async verifyEmptyState() {
    await expect(this.emptyState).toBeVisible();
  }

  /**
   * Verify user table is visible
   */
  async verifyUserTableVisible() {
    await expect(this.userTable).toBeVisible();
  }
}
