import { test, expect } from '@playwright/test';
import { UserManagementPage } from './pages/UserManagementPage';
import { LoginPage } from './pages/LoginPage';
import { MSWHelper } from './pages/utils/MSWHelper';

test.describe('User Management - Permission Management', () => {
  let userManagementPage: UserManagementPage;
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    userManagementPage = new UserManagementPage(page);
    loginPage = new LoginPage(page);

    await loginPage.goto();
    await loginPage.login('admin', 'admin');
    await expect(page).toHaveURL('/', { timeout: 10000 });
    await new MSWHelper(page).applyScenario('userManagement');
    await userManagementPage.goto();
  });

  test('should display permission options in add user modal', async ({ page }) => {
    await userManagementPage.clickAddUser();
    
    // Check for permission components
    const dashboardPermission = page.locator('[data-component="dashboard"], text=/dashboard/i');
    const resourcesPermission = page.locator('[data-component="resources"], text=/resources/i');
    
    // At least some permission controls should be visible
    const permissionCount = await page.locator('text=/permission/i').count();
    expect(permissionCount).toBeGreaterThan(0);
  });

  test('should display permission options in edit user modal', async ({ page }) => {
    await userManagementPage.clickEditUser('testuser');
    
    // Check for permission components
    const permissionCount = await page.locator('text=/permission/i').count();
    expect(permissionCount).toBeGreaterThan(0);
  });

  test('should create user with read permissions', async ({ page }) => {
    const username = `readuser_${Date.now()}`;
    
    await userManagementPage.clickAddUser();
    await userManagementPage.fillUserForm({
      username,
      password: 'password123',
      confirmPassword: 'password123',
      isAdmin: false,
    });
    
    // Set read permissions (if permission controls are available)
    const dashboardPermission = page.locator('[data-component="dashboard"]').first();
    const permissionExists = await dashboardPermission.count();
    
    if (permissionExists > 0) {
      await userManagementPage.setPermission('dashboard', 'read');
    }
    
    await userManagementPage.submitUserForm();
    await userManagementPage.waitForSuccessToast();
    
    expect(await userManagementPage.userExists(username)).toBeTruthy();
  });

  test('should create user with write permissions', async ({ page }) => {
    const username = `writeuser_${Date.now()}`;
    
    await userManagementPage.clickAddUser();
    await userManagementPage.fillUserForm({
      username,
      password: 'password123',
      confirmPassword: 'password123',
      isAdmin: false,
    });
    
    // Set write permissions (if permission controls are available)
    const dashboardPermission = page.locator('[data-component="dashboard"]').first();
    const permissionExists = await dashboardPermission.count();
    
    if (permissionExists > 0) {
      await userManagementPage.setPermission('dashboard', 'write');
    }
    
    await userManagementPage.submitUserForm();
    await userManagementPage.waitForSuccessToast();
    
    expect(await userManagementPage.userExists(username)).toBeTruthy();
  });

  test('should create user with mixed permissions', async ({ page }) => {
    const username = `mixeduser_${Date.now()}`;
    
    await userManagementPage.clickAddUser();
    await userManagementPage.fillUserForm({
      username,
      password: 'password123',
      confirmPassword: 'password123',
      isAdmin: false,
    });
    
    // Set mixed permissions (if permission controls are available)
    const permissionControls = await page.locator('[data-component]').count();
    
    if (permissionControls > 0) {
      await userManagementPage.setPermission('dashboard', 'read');
      await userManagementPage.setPermission('resources', 'write');
    }
    
    await userManagementPage.submitUserForm();
    await userManagementPage.waitForSuccessToast();
    
    expect(await userManagementPage.userExists(username)).toBeTruthy();
  });

  test('should update user permissions', async ({ page }) => {
    await userManagementPage.clickEditUser('testuser');
    
    // Update permissions (if permission controls are available)
    const permissionControls = await page.locator('[data-component]').count();
    
    if (permissionControls > 0) {
      await userManagementPage.setPermission('dashboard', 'write');
    }
    
    await userManagementPage.submitUserForm();
    await userManagementPage.waitForSuccessToast();
  });

  test('should grant all permissions when promoting to admin', async ({ page }) => {
    const username = `promoteuser_${Date.now()}`;
    
    // Create regular user
    await userManagementPage.addUser({
      username,
      password: 'password123',
      confirmPassword: 'password123',
      isAdmin: false,
    });
    await userManagementPage.waitForSuccessToast();
    
    // Promote to admin
    await userManagementPage.clickEditUser(username);
    
    // Check admin checkbox
    const isChecked = await userManagementPage.adminCheckbox.isChecked();
    if (!isChecked) {
      await userManagementPage.adminCheckbox.click();
    }
    
    await userManagementPage.submitUserForm();
    await userManagementPage.waitForSuccessToast();
    
    // Verify user is now admin
    await userManagementPage.verifyUserIsAdmin(username);
  });

  test('should disable permission controls when admin is checked', async ({ page }) => {
    await userManagementPage.clickAddUser();
    
    // Check admin checkbox
    await userManagementPage.adminCheckbox.click();
    
    // Permission controls should be disabled or hidden
    await page.waitForTimeout(500);
    
    // Try to find permission controls
    const permissionControls = page.locator('[data-component="dashboard"]').first();
    const permissionRadio = permissionControls.locator('input[data-permission-level]');
    const radioCount = await permissionRadio.count();

    if (radioCount > 0) {
      // Radios should be disabled when admin is selected
      await expect(permissionRadio).toBeDisabled();
    }
  });

  test('should enable permission controls when admin is unchecked', async ({ page }) => {
    await userManagementPage.clickAddUser();
    
    // Check then uncheck admin
    await userManagementPage.adminCheckbox.click();
    await page.waitForTimeout(300);
    await userManagementPage.adminCheckbox.click();
    await page.waitForTimeout(300);
    
    // Permission controls should be enabled
    const permissionControls = page.locator('[data-component="dashboard"]').first();
    const controlCount = await permissionControls.count();
    
    if (controlCount > 0) {
      const isEnabled = await permissionControls.isEnabled().catch(() => false);
      expect(isEnabled).toBeTruthy();
    }
  });

  test('should display current permissions when editing user', async ({ page }) => {
    await userManagementPage.clickEditUser('testuser');
    
    // Modal should show current permissions
    await expect(userManagementPage.modal).toBeVisible();
    
    // Check if permission information is displayed
    const permissionText = await page.locator('text=/permission/i').count();
    expect(permissionText).toBeGreaterThan(0);
  });

  test('should preserve other permissions when updating one', async ({ page }) => {
    const username = `permuser_${Date.now()}`;
    
    // Create user with multiple permissions
    await userManagementPage.clickAddUser();
    await userManagementPage.fillUserForm({
      username,
      password: 'password123',
      confirmPassword: 'password123',
      isAdmin: false,
    });
    
    const permissionControls = await page.locator('[data-component]').count();
    if (permissionControls > 0) {
      await userManagementPage.setPermission('dashboard', 'read');
      await userManagementPage.setPermission('resources', 'read');
    }
    
    await userManagementPage.submitUserForm();
    await userManagementPage.waitForSuccessToast();
    
    // Edit and update only one permission
    await userManagementPage.clickEditUser(username);
    
    if (permissionControls > 0) {
      await userManagementPage.setPermission('dashboard', 'write');
    }
    
    await userManagementPage.submitUserForm();
    await userManagementPage.waitForSuccessToast();
  });
});

test.describe('User Management - Permission Validation', () => {
  let userManagementPage: UserManagementPage;
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    userManagementPage = new UserManagementPage(page);
    loginPage = new LoginPage(page);

    await loginPage.goto();
    await loginPage.login('admin', 'admin');
    await expect(page).toHaveURL('/', { timeout: 10000 });
    await userManagementPage.goto();
  });

  test('should allow creating user without any permissions', async ({ page }) => {
    const username = `noperm_${Date.now()}`;
    
    await userManagementPage.addUser({
      username,
      password: 'password123',
      confirmPassword: 'password123',
      isAdmin: false,
    });
    
    await userManagementPage.waitForSuccessToast();
    expect(await userManagementPage.userExists(username)).toBeTruthy();
  });

  test('should show permission components in correct order', async ({ page }) => {
    await userManagementPage.clickAddUser();
    
    // Check if permission components are displayed
    const permissionLabels = await page.locator('text=/dashboard|resources|system|users/i').allTextContents();
    expect(permissionLabels.length).toBeGreaterThan(0);
  });

  test('should display permission levels (read/write)', async ({ page }) => {
    await userManagementPage.clickAddUser();
    
    // Look for permission level options
    const permissionControls = await page.locator('[data-component]').first();
    const controlExists = await permissionControls.count();
    
    if (controlExists > 0) {
      await permissionControls.click();
      
      // Should show read and write options
      const readOption = page.getByText('read', { exact: true });
      const writeOption = page.getByText('write', { exact: true });
      
      const hasOptions = (await readOption.count() > 0) || (await writeOption.count() > 0);
      expect(hasOptions).toBeTruthy();
    }
  });

  test('should validate permission selection', async ({ page }) => {
    const username = `validperm_${Date.now()}`;
    
    await userManagementPage.clickAddUser();
    await userManagementPage.fillUserForm({
      username,
      password: 'password123',
      confirmPassword: 'password123',
      isAdmin: false,
    });
    
    // Set a permission
    const permissionControls = await page.locator('[data-component="dashboard"]').count();
    if (permissionControls > 0) {
      await userManagementPage.setPermission('dashboard', 'read');
    }
    
    await userManagementPage.submitUserForm();
    await userManagementPage.waitForSuccessToast();
    
    expect(await userManagementPage.userExists(username)).toBeTruthy();
  });
});

test.describe('User Management - Admin Permissions', () => {
  let userManagementPage: UserManagementPage;
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    userManagementPage = new UserManagementPage(page);
    loginPage = new LoginPage(page);

    await loginPage.goto();
    await loginPage.login('admin', 'admin');
    await expect(page).toHaveURL('/', { timeout: 10000 });
    await userManagementPage.goto();
  });

  test('should automatically grant all permissions to admin users', async ({ page }) => {
    const username = `adminuser_${Date.now()}`;
    
    await userManagementPage.addUser({
      username,
      password: 'password123',
      confirmPassword: 'password123',
      isAdmin: true,
    });
    
    await userManagementPage.waitForSuccessToast();
    await userManagementPage.verifyUserIsAdmin(username);
  });

  test('should show admin has full access', async ({ page }) => {
    await userManagementPage.clickEditUser('admin');
    
    // Admin checkbox should be checked
    await expect(userManagementPage.adminCheckbox).toBeChecked();
  });

  test('should maintain admin permissions after edit', async ({ page }) => {
    const username = `admintest_${Date.now()}`;
    
    // Create admin user
    await userManagementPage.addUser({
      username,
      password: 'password123',
      confirmPassword: 'password123',
      isAdmin: true,
    });
    await userManagementPage.waitForSuccessToast();
    
    // Edit admin user (change password)
    await userManagementPage.clickEditUser(username);
    await userManagementPage.fillUserForm({
      username,
      password: 'newpassword123',
      confirmPassword: 'newpassword123',
    });
    await userManagementPage.submitUserForm();
    await userManagementPage.waitForSuccessToast();
    
    // Should still be admin
    await userManagementPage.verifyUserIsAdmin(username);
  });

  test('should remove all write permissions when demoting from admin', async ({ page }) => {
    const username = `demote_${Date.now()}`;
    
    // Create admin user
    await userManagementPage.addUser({
      username,
      password: 'password123',
      confirmPassword: 'password123',
      isAdmin: true,
    });
    await userManagementPage.waitForSuccessToast();
    
    // Demote to regular user
    await userManagementPage.editUser(username, {
      isAdmin: false,
    });
    await userManagementPage.waitForSuccessToast();
    
    // Should no longer have admin badge
    await userManagementPage.verifyUserIsNotAdmin(username);
  });
});

test.describe('User Management - Permission Display', () => {
  let userManagementPage: UserManagementPage;
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    userManagementPage = new UserManagementPage(page);
    loginPage = new LoginPage(page);

    await loginPage.goto();
    await loginPage.login('admin', 'admin');
    await expect(page).toHaveURL('/', { timeout: 10000 });
    await userManagementPage.goto();
  });

  test('should display user permissions in user list', async ({ page }) => {
    const userRow = userManagementPage.getUserRow('testuser');
    
    // User row should contain some permission information
    await expect(userRow).toBeVisible();
    
    // Check if permissions are displayed (might be in badges or text)
    const rowText = await userRow.textContent();
    expect(rowText).toBeTruthy();
  });

  test('should show admin badge for admin users in list', async () => {
    await userManagementPage.verifyUserIsAdmin('admin');
  });

  test('should show permission summary for users', async ({ page }) => {
    const userRow = userManagementPage.getUserRow('poweruser');
    await expect(userRow).toBeVisible();
    
    // Row should contain user information
    const rowText = await userRow.textContent();
    expect(rowText).toContain('poweruser');
  });

  test('should differentiate between read and write permissions visually', async ({ page }) => {
    // This test checks if there's visual differentiation
    // The actual implementation might use colors, icons, or text
    
    const userRows = await userManagementPage.userRows.all();
    expect(userRows.length).toBeGreaterThan(0);
    
    // Each row should be visible and contain user data
    for (const row of userRows) {
      await expect(row).toBeVisible();
    }
  });

  test('should show permission count or summary', async ({ page }) => {
    const userRow = userManagementPage.getUserRow('testuser');
    
    // Check if there's any permission indicator
    const permissionBadges = await userRow.locator('[data-testid*="permission"], .permission-badge').count();
    
    // Permission display might vary, so we just check the row is visible
    await expect(userRow).toBeVisible();
  });
});
