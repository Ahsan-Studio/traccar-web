import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Report Properties Dialog
 * Tests verify that V2 matches V1 behavior
 */

test.describe('Report Properties Dialog', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Check if we need to login
    const loginForm = page.locator('input[name="email"], input[placeholder*="Email"]');
    if (await loginForm.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Login with test credentials
      await loginForm.fill('admin');
      await page.locator('input[name="password"], input[placeholder*="Password"]').fill('admin');
      await page.locator('button:has-text("Login")').click();
      await page.waitForLoadState('networkidle');
    }
  });

  test('should open report dialog when clicking Reports menu', async ({ page }) => {
    // Look for Reports button/link in the UI
    const reportsButton = page.locator('button:has-text("Reports"), [data-testid="reports-button"]').first();
    await reportsButton.click();

    // Wait for dialog to appear
    const dialog = page.locator('[role="dialog"]:has-text("Reports")');
    await expect(dialog).toBeVisible({ timeout: 10000 });
  });

  test('should open report properties dialog when clicking Add', async ({ page }) => {
    // Open Reports dialog
    const reportsButton = page.locator('button:has-text("Reports"), [data-testid="reports-button"]').first();
    await reportsButton.click();

    // Wait for dialog and click Add button
    const dialog = page.locator('[role="dialog"]:has-text("Reports")');
    await expect(dialog).toBeVisible({ timeout: 10000 });

    const addButton = dialog.locator('button:has-text("Add"), button[title="Add"]').first();
    await addButton.click();

    // Verify properties dialog is open
    const propertiesDialog = page.locator('[role="dialog"]:has-text("Report Properties")');
    await expect(propertiesDialog).toBeVisible({ timeout: 10000 });
  });

  test('should display all required fields for General Information report (V1 layout)', async ({ page }) => {
    // Open Reports dialog and add new report
    await page.locator('button:has-text("Reports"), [data-testid="reports-button"]').first().click();
    await page.locator('[role="dialog"]:has-text("Reports")').waitFor({ state: 'visible' });
    await page.locator('[role="dialog"]:has-text("Reports") button:has-text("Add")').first().click();
    await page.locator('[role="dialog"]:has-text("Report Properties")').waitFor({ state: 'visible' });

    const dialog = page.locator('[role="dialog"]:has-text("Report Properties")');

    // Verify all V1 fields are present (two-column layout)
    // Left column fields
    const leftColumnFields = [
      'Name',
      'Type',
      'Objects',
      'Markers',
      'Zones',
      'Sensors',
      'Data items',
      'Format',
    ];

    // Right column fields
    const rightColumnFields = [
      'Ignore empty reports',
      'Show coordinates',
      'Show addresses',
      'Markers instead of addresses',
      'Zones instead of addresses',
      'Stops',
      'Speed limit (kph)',
    ];

    for (const fieldName of leftColumnFields) {
      const field = dialog.locator(`text="${fieldName}"`).first();
      await expect(field).toBeVisible({ timeout: 5000 });
    }

    for (const fieldName of rightColumnFields) {
      const field = dialog.locator(`text="${fieldName}"`).first();
      await expect(field).toBeVisible({ timeout: 5000 });
    }
  });

  test('should show Zones dropdown but disabled for General Information type', async ({ page }) => {
    // Open Reports dialog and add new report
    await page.locator('button:has-text("Reports"), [data-testid="reports-button"]').first().click();
    await page.locator('[role="dialog"]:has-text("Reports")').waitFor({ state: 'visible' });
    await page.locator('[role="dialog"]:has-text("Reports") button:has-text("Add")').first().click();
    await page.locator('[role="dialog"]:has-text("Report Properties")').waitFor({ state: 'visible' });

    const dialog = page.locator('[role="dialog"]:has-text("Report Properties")');

    // Verify Type is set to General Information (default)
    const typeSelect = dialog.locator('text="Type"').locator('..').locator('..');
    await expect(typeSelect).toContainText('General');

    // V1 behavior: Zones dropdown is VISIBLE but DISABLED for non-zone types
    const zonesLabel = dialog.locator('span:has-text("Zones")').filter({ hasNotText: 'Zones instead' });
    await expect(zonesLabel).toBeVisible();

    // Check if the dropdown is disabled
    const zonesDropdown = zonesLabel.locator('..').locator('.custom-multiselect');
    await expect(zonesDropdown).toHaveClass(/disabled/);
  });

  test('should show Sensors dropdown but disabled for General Information type', async ({ page }) => {
    // Open Reports dialog and add new report
    await page.locator('button:has-text("Reports"), [data-testid="reports-button"]').first().click();
    await page.locator('[role="dialog"]:has-text("Reports")').waitFor({ state: 'visible' });
    await page.locator('[role="dialog"]:has-text("Reports") button:has-text("Add")').first().click();
    await page.locator('[role="dialog"]:has-text("Report Properties")').waitFor({ state: 'visible' });

    const dialog = page.locator('[role="dialog"]:has-text("Report Properties")');

    // V1 behavior: Sensors dropdown is VISIBLE but DISABLED for non-sensor types
    const sensorsLabel = dialog.locator('span:has-text("Sensors")');
    await expect(sensorsLabel).toBeVisible();

    // Check if the dropdown is disabled
    const sensorsDropdown = sensorsLabel.locator('..').locator('.custom-multiselect');
    await expect(sensorsDropdown).toHaveClass(/disabled/);
  });

  test('should enable Zones dropdown for Zone In/Out report type', async ({ page }) => {
    // Open Reports dialog and add new report
    await page.locator('button:has-text("Reports"), [data-testid="reports-button"]').first().click();
    await page.locator('[role="dialog"]:has-text("Reports")').waitFor({ state: 'visible' });
    await page.locator('[role="dialog"]:has-text("Reports") button:has-text("Add")').first().click();
    await page.locator('[role="dialog"]:has-text("Report Properties")').waitFor({ state: 'visible' });

    const dialog = page.locator('[role="dialog"]:has-text("Report Properties")');

    // Change Type to Zone In/Out
    const typeDropdown = dialog.locator('.MuiSelect-root, [role="combobox"]').first();
    await typeDropdown.click();

    // Select Zone In/Out from dropdown
    const zoneInOutOption = page.locator('li:has-text("Zone In/Out")').first();
    await zoneInOutOption.click();

    // Zones dropdown should be visible and ENABLED
    const zonesLabel = dialog.locator('span:has-text("Zones")').filter({ hasNotText: 'Zones instead' });
    await expect(zonesLabel).toBeVisible({ timeout: 5000 });

    // Check if the dropdown is NOT disabled
    const zonesDropdown = zonesLabel.locator('..').locator('.custom-multiselect');
    await expect(zonesDropdown).not.toHaveClass(/disabled/);
  });

  test('should enable Sensors dropdown for Drives and Stops with Sensors report type', async ({ page }) => {
    // Open Reports dialog and add new report
    await page.locator('button:has-text("Reports"), [data-testid="reports-button"]').first().click();
    await page.locator('[role="dialog"]:has-text("Reports")').waitFor({ state: 'visible' });
    await page.locator('[role="dialog"]:has-text("Reports") button:has-text("Add")').first().click();
    await page.locator('[role="dialog"]:has-text("Report Properties")').waitFor({ state: 'visible' });

    const dialog = page.locator('[role="dialog"]:has-text("Report Properties")');

    // Change Type to Drives and Stops with Sensors
    const typeDropdown = dialog.locator('.MuiSelect-root, [role="combobox"]').first();
    await typeDropdown.click();

    // Select Drives and Stops with Sensors from dropdown
    const sensorOption = page.locator('li:has-text("Drives and Stops with Sensors")').first();
    await sensorOption.click();

    // Sensors dropdown should be visible and ENABLED
    const sensorsLabel = dialog.locator('span:has-text("Sensors")');
    await expect(sensorsLabel).toBeVisible({ timeout: 5000 });

    // Check if the dropdown is NOT disabled
    const sensorsDropdown = sensorsLabel.locator('..').locator('.custom-multiselect');
    await expect(sensorsDropdown).not.toHaveClass(/disabled/);
  });

  test('should have correct default values', async ({ page }) => {
    // Open Reports dialog and add new report
    await page.locator('button:has-text("Reports"), [data-testid="reports-button"]').first().click();
    await page.locator('[role="dialog"]:has-text("Reports")').waitFor({ state: 'visible' });
    await page.locator('[role="dialog"]:has-text("Reports") button:has-text("Add")').first().click();
    await page.locator('[role="dialog"]:has-text("Report Properties")').waitFor({ state: 'visible' });

    const dialog = page.locator('[role="dialog"]:has-text("Report Properties")');

    // Check default Format is HTML
    const formatValue = dialog.locator('text="Format"').locator('..').locator('..');
    await expect(formatValue).toContainText('HTML');

    // Check default Type is General Information
    const typeValue = dialog.locator('text="Type"').locator('..').locator('..');
    await expect(typeValue).toContainText('General');

    // Check Show coordinates is checked by default
    const showCoordinatesCheckbox = dialog.locator('text="Show coordinates"').locator('..').locator('input[type="checkbox"]');
    await expect(showCoordinatesCheckbox).toBeChecked();

    // Check Ignore empty reports is unchecked by default
    const ignoreEmptyCheckbox = dialog.locator('text="Ignore empty reports"').locator('..').locator('input[type="checkbox"]');
    await expect(ignoreEmptyCheckbox).not.toBeChecked();
  });

  test('should allow entering report name', async ({ page }) => {
    // Open Reports dialog and add new report
    await page.locator('button:has-text("Reports"), [data-testid="reports-button"]').first().click();
    await page.locator('[role="dialog"]:has-text("Reports")').waitFor({ state: 'visible' });
    await page.locator('[role="dialog"]:has-text("Reports") button:has-text("Add")').first().click();
    await page.locator('[role="dialog"]:has-text("Report Properties")').waitFor({ state: 'visible' });

    const dialog = page.locator('[role="dialog"]:has-text("Report Properties")');

    // Enter report name
    const nameInput = dialog.locator('input[placeholder="Report name"]').first();
    await nameInput.fill('Test Report E2E');

    // Verify the value was entered
    await expect(nameInput).toHaveValue('Test Report E2E');
  });

  test('should allow toggling checkboxes', async ({ page }) => {
    // Open Reports dialog and add new report
    await page.locator('button:has-text("Reports"), [data-testid="reports-button"]').first().click();
    await page.locator('[role="dialog"]:has-text("Reports")').waitFor({ state: 'visible' });
    await page.locator('[role="dialog"]:has-text("Reports") button:has-text("Add")').first().click();
    await page.locator('[role="dialog"]:has-text("Report Properties")').waitFor({ state: 'visible' });

    const dialog = page.locator('[role="dialog"]:has-text("Report Properties")');

    // Toggle Ignore empty reports checkbox
    const ignoreEmptyCheckbox = dialog.locator('text="Ignore empty reports"').locator('..').locator('input[type="checkbox"]');
    await expect(ignoreEmptyCheckbox).not.toBeChecked();
    await ignoreEmptyCheckbox.click();
    await expect(ignoreEmptyCheckbox).toBeChecked();

    // Toggle Show addresses checkbox
    const showAddressesCheckbox = dialog.locator('text="Show addresses"').locator('..').locator('input[type="checkbox"]');
    await expect(showAddressesCheckbox).not.toBeChecked();
    await showAddressesCheckbox.click();
    await expect(showAddressesCheckbox).toBeChecked();
  });

  test('should close dialog on Cancel button', async ({ page }) => {
    // Open Reports dialog and add new report
    await page.locator('button:has-text("Reports"), [data-testid="reports-button"]').first().click();
    await page.locator('[role="dialog"]:has-text("Reports")').waitFor({ state: 'visible' });
    await page.locator('[role="dialog"]:has-text("Reports") button:has-text("Add")').first().click();
    await page.locator('[role="dialog"]:has-text("Report Properties")').waitFor({ state: 'visible' });

    const dialog = page.locator('[role="dialog"]:has-text("Report Properties")');

    // Click Cancel button
    const cancelButton = dialog.locator('button:has-text("Cancel")');
    await cancelButton.click();

    // Verify dialog is closed
    await expect(dialog).not.toBeVisible({ timeout: 5000 });
  });

  test('should have Schedule section with Daily, Weekly, and Email fields', async ({ page }) => {
    // Open Reports dialog and add new report
    await page.locator('button:has-text("Reports"), [data-testid="reports-button"]').first().click();
    await page.locator('[role="dialog"]:has-text("Reports")').waitFor({ state: 'visible' });
    await page.locator('[role="dialog"]:has-text("Reports") button:has-text("Add")').first().click();
    await page.locator('[role="dialog"]:has-text("Report Properties")').waitFor({ state: 'visible' });

    const dialog = page.locator('[role="dialog"]:has-text("Report Properties")');

    // Verify Schedule section exists
    await expect(dialog.locator('text="Schedule"')).toBeVisible();

    // Verify Daily checkbox
    await expect(dialog.locator('text="Daily"')).toBeVisible();

    // Verify Weekly checkbox
    await expect(dialog.locator('text="Weekly"')).toBeVisible();

    // Verify Send to e-mail field
    await expect(dialog.locator('text="Send to e-mail"')).toBeVisible();
  });

  test('should have Time period section with Filter and date fields', async ({ page }) => {
    // Open Reports dialog and add new report
    await page.locator('button:has-text("Reports"), [data-testid="reports-button"]').first().click();
    await page.locator('[role="dialog"]:has-text("Reports")').waitFor({ state: 'visible' });
    await page.locator('[role="dialog"]:has-text("Reports") button:has-text("Add")').first().click();
    await page.locator('[role="dialog"]:has-text("Report Properties")').waitFor({ state: 'visible' });

    const dialog = page.locator('[role="dialog"]:has-text("Report Properties")');

    // Verify Time period section exists
    await expect(dialog.locator('text="Time period"')).toBeVisible();

    // Verify Filter dropdown
    await expect(dialog.locator('text="Filter"')).toBeVisible();

    // Verify Time from field
    await expect(dialog.locator('text="Time from"')).toBeVisible();

    // Verify Time to field
    await expect(dialog.locator('text="Time to"')).toBeVisible();
  });

  test('should validate required fields on Generate', async ({ page }) => {
    // Open Reports dialog and add new report
    await page.locator('button:has-text("Reports"), [data-testid="reports-button"]').first().click();
    await page.locator('[role="dialog"]:has-text("Reports")').waitFor({ state: 'visible' });
    await page.locator('[role="dialog"]:has-text("Reports") button:has-text("Add")').first().click();
    await page.locator('[role="dialog"]:has-text("Report Properties")').waitFor({ state: 'visible' });

    const dialog = page.locator('[role="dialog"]:has-text("Report Properties")');

    // Try to generate without selecting objects
    const generateButton = dialog.locator('button:has-text("Generate")');

    // Setup dialog handler for alert
    page.on('dialog', async (dialog) => {
      expect(dialog.message()).toContain('at least 1 object');
      await dialog.accept();
    });

    await generateButton.click();
  });
});

test.describe('Report Type Conditional Fields', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Login if needed
    const loginForm = page.locator('input[name="email"], input[placeholder*="Email"]');
    if (await loginForm.isVisible({ timeout: 5000 }).catch(() => false)) {
      await loginForm.fill('admin');
      await page.locator('input[name="password"], input[placeholder*="Password"]').fill('admin');
      await page.locator('button:has-text("Login")').click();
      await page.waitForLoadState('networkidle');
    }
  });

  const reportTypesWithZones = [
    'Zone In/Out',
    'Zone In/Out with General Info',
  ];

  for (const reportType of reportTypesWithZones) {
    test(`should enable Zones dropdown for "${reportType}" type`, async ({ page }) => {
      // Open Reports dialog
      await page.locator('button:has-text("Reports"), [data-testid="reports-button"]').first().click();
      await page.locator('[role="dialog"]:has-text("Reports")').waitFor({ state: 'visible' });
      await page.locator('[role="dialog"]:has-text("Reports") button:has-text("Add")').first().click();
      await page.locator('[role="dialog"]:has-text("Report Properties")').waitFor({ state: 'visible' });

      const dialog = page.locator('[role="dialog"]:has-text("Report Properties")');

      // Select report type
      const typeDropdown = dialog.locator('.MuiSelect-root, [role="combobox"]').first();
      await typeDropdown.click();
      await page.locator(`li:has-text("${reportType}")`).first().click();

      // Verify Zones dropdown is visible and enabled
      const zonesLabel = dialog.locator('span:has-text("Zones")').filter({ hasNotText: 'Zones instead' });
      await expect(zonesLabel).toBeVisible({ timeout: 5000 });

      // Check if the dropdown is NOT disabled
      const zonesDropdown = zonesLabel.locator('..').locator('.custom-multiselect');
      await expect(zonesDropdown).not.toHaveClass(/disabled/);
    });
  }

  const reportTypesWithSensors = [
    'Drives and Stops with Sensors',
    'Drives and Stops with Logic Sensors',
    'Logic Sensors',
    'Sensor',
    'Route Data with Sensors',
  ];

  for (const reportType of reportTypesWithSensors) {
    test(`should enable Sensors dropdown for "${reportType}" type`, async ({ page }) => {
      // Open Reports dialog
      await page.locator('button:has-text("Reports"), [data-testid="reports-button"]').first().click();
      await page.locator('[role="dialog"]:has-text("Reports")').waitFor({ state: 'visible' });
      await page.locator('[role="dialog"]:has-text("Reports") button:has-text("Add")').first().click();
      await page.locator('[role="dialog"]:has-text("Report Properties")').waitFor({ state: 'visible' });

      const dialog = page.locator('[role="dialog"]:has-text("Report Properties")');

      // Select report type
      const typeDropdown = dialog.locator('.MuiSelect-root, [role="combobox"]').first();
      await typeDropdown.click();
      await page.locator(`li:has-text("${reportType}")`).first().click();

      // Verify Sensors dropdown is visible and enabled
      const sensorsLabel = dialog.locator('span:has-text("Sensors")');
      await expect(sensorsLabel).toBeVisible({ timeout: 5000 });

      // Check if the dropdown is NOT disabled
      const sensorsDropdown = sensorsLabel.locator('..').locator('.custom-multiselect');
      await expect(sensorsDropdown).not.toHaveClass(/disabled/);
    });
  }
});
