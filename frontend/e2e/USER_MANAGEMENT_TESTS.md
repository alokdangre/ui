# User Management E2E Tests

This directory contains comprehensive end-to-end tests for the User Management section of the application.

## Test Files

### 1. UserManagement.spec.ts
**Core Functionality Tests**
- Page element visibility and layout
- User list display and navigation
- Modal interactions (open/close)
- Refresh functionality
- Filter panel interactions
- User actions (edit/delete buttons)
- Loading states
- Accessibility features
- Responsive design across different viewports

### 2. UserManagementCRUD.spec.ts
**Create, Read, Update, Delete Operations**

#### Create Operations
- Create regular users
- Create admin users
- Form validation (password mismatch, empty fields)
- Prevent duplicate usernames
- Form reset on modal close

#### Update Operations
- Update username
- Update password
- Promote user to admin
- Demote admin to regular user
- Validation during updates
- Cancel edit without changes

#### Delete Operations
- Delete users successfully
- Confirmation modal display
- Cancel delete operation
- Prevent deleting admin user
- Update user count after deletion
- Sequential deletions

#### Complex Workflows
- Create, update, and delete in sequence
- Rapid successive operations
- Data integrity maintenance

### 3. UserManagementFilters.spec.ts
**Search and Filter Functionality**

#### Search Functionality
- Search by username (exact and partial)
- Case-insensitive search
- No results handling
- Clear search
- Real-time search updates
- Search by role

#### Filter Functionality
- Filter by admin role
- Filter by user role
- Show all users
- Clear all filters
- Persist filter selection
- Filter count badge

#### Combined Search and Filter
- Combine search with role filter
- Clear search while maintaining filter
- Clear filter while maintaining search
- Clear both search and filter
- Handle no results from combined filters

#### Sorting
- Default sort order
- Maintain sort after operations
- Sort with search applied
- Sort with filter applied

#### Performance
- Quick page load
- Search debouncing
- Rapid filter changes
- Multiple operations performance

### 4. UserManagementPermissions.spec.ts
**Permission Management Tests**

#### Permission Management
- Display permission options in modals
- Create user with read permissions
- Create user with write permissions
- Create user with mixed permissions
- Update user permissions
- Grant all permissions when promoting to admin

#### Permission Validation
- Create user without permissions
- Permission components order
- Permission levels (read/write)
- Permission selection validation

#### Admin Permissions
- Automatically grant all permissions to admins
- Show admin has full access
- Maintain admin permissions after edit
- Remove write permissions when demoting from admin

#### Permission Display
- Display user permissions in list
- Show admin badge
- Show permission summary
- Visual differentiation between read/write
- Permission count or summary

## Page Object Model

### UserManagementPage
Located at: `e2e/pages/UserManagementPage.ts`

**Key Methods:**
- `goto()` - Navigate to user management page
- `addUser(data)` - Add a new user
- `editUser(username, data)` - Edit an existing user
- `deleteUser(username)` - Delete a user
- `searchUsers(term)` - Search for users
- `setRoleFilter(role)` - Apply role filter
- `clearFilters()` - Clear all filters
- `userExists(username)` - Check if user exists
- `getUserCount()` - Get total user count
- `verifyUserIsAdmin(username)` - Verify admin badge
- `waitForSuccessToast()` - Wait for success notification
- `waitForErrorToast()` - Wait for error notification

## MSW Mock Handlers

The tests use Mock Service Worker (MSW) for API mocking. All handlers are defined in:
- `src/mocks/handlers.ts`

**User Management Handlers:**
- `userActivities` - GET /api/admin/users
- `createUser` - POST /api/admin/users
- `updateUser` - PUT /api/admin/users/:username
- `updateUserPermissions` - PUT /api/admin/users/:username/permissions
- `getUserPermissions` - GET /api/admin/users/:username/permissions
- `deleteUser` - DELETE /api/admin/users/:username

**MSW Scenario:**
The `userManagement` scenario in `src/mocks/browser.ts` includes all necessary handlers for user management tests.

## Running the Tests

### Run all user management tests:
```bash
npm run test:e2e -- UserManagement*.spec.ts
```

### Run specific test file:
```bash
npm run test:e2e -- UserManagement.spec.ts
npm run test:e2e -- UserManagementCRUD.spec.ts
npm run test:e2e -- UserManagementFilters.spec.ts
npm run test:e2e -- UserManagementPermissions.spec.ts
```

### Run in headed mode (with browser visible):
```bash
npm run test:e2e -- UserManagement.spec.ts --headed
```

### Run in debug mode:
```bash
npm run test:e2e -- UserManagement.spec.ts --debug
```

### Run specific test:
```bash
npm run test:e2e -- UserManagement.spec.ts -g "should create a new user"
```

## Test Coverage

The test suite covers:
- ✅ User creation with validation
- ✅ User editing and updates
- ✅ User deletion with confirmation
- ✅ Search functionality
- ✅ Role-based filtering
- ✅ Permission management
- ✅ Admin user privileges
- ✅ Form validation
- ✅ Error handling
- ✅ Loading states
- ✅ Accessibility features
- ✅ Responsive design
- ✅ Data integrity
- ✅ Complex workflows

## Test Data

**Default Mock Users:**
1. **admin** - Admin user with full permissions
2. **testuser** - Regular user with read permissions
3. **poweruser** - Regular user with mixed permissions

## Best Practices

1. **Always login before accessing user management** - Tests use admin credentials
2. **Use unique usernames** - Tests generate usernames with timestamps to avoid conflicts
3. **Wait for toasts** - Always wait for success/error toasts to confirm operations
4. **Clean up test data** - Delete created users when possible
5. **Use page object methods** - Avoid direct page interactions in tests
6. **Handle timing** - Use appropriate waits for async operations

## Troubleshooting

### Tests failing due to timeout
- Increase timeout in test configuration
- Check if MSW is properly initialized
- Verify backend is running (if not using MSW)

### Modal not appearing
- Check if user is logged in as admin
- Verify button selectors in page object
- Check for JavaScript errors in console

### User not found after creation
- Wait for success toast before checking
- Verify MSW handlers are working
- Check network tab for API calls

### Permission tests failing
- Verify permission controls are rendered
- Check if admin checkbox affects permission fields
- Ensure MSW handlers return correct permission data

## Future Enhancements

- [ ] Add tests for bulk user operations
- [ ] Add tests for user import/export
- [ ] Add tests for password strength validation
- [ ] Add tests for user session management
- [ ] Add tests for audit logs
- [ ] Add visual regression tests
- [ ] Add performance benchmarks
