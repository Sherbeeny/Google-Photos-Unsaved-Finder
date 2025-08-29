import { test, expect } from '@playwright/test';

test.describe('Google Photos Saved Finder E2E', () => {
  test('should display UI and load albums when GPTK API is available (Happy Path)', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    // Add logging to see what's happening in the browser
    page.on('console', msg => console.log(`[BROWSER] ${msg.type()}: ${msg.text()}`));
    page.on('pageerror', error => console.error(`[BROWSER PAGE ERROR] ${error.message}`));

    // --- MOCKING STRATEGY ---
    // Inject all necessary mocks and shims before the page loads anything.
    await page.addInitScript({
      content: `
        // 1. Set flag for our script to know it's in a test environment
        window.E2E_TESTING = true;

        // 2. Mock the GM APIs our script uses
        window.GM_registerMenuCommand = (name, fn) => {
          if (name === 'Start Google Photos Saved Finder') {
            window.gpsf_menu_command = fn;
          }
        };
        window.GM_info = {
          script: { name: 'GPSF', version: '0.0.0' },
          scriptHandler: 'Tampermonkey',
          version: '4.18.1'
        };

        // 3. Mock the specific, problematic GPTK API function
        // This isolates our script from the complex GPTK script.
        window.unsafeWindow = window;
        window.unsafeWindow.gptkApiUtils = {
          getAllAlbums: async () => {
            console.log('[E2E MOCK] gptkApiUtils.getAllAlbums called, returning mock data.');
            return [
              { mediaKey: 'album1', title: 'Test Album 1', itemCount: 10 },
              { mediaKey: 'album2', title: 'Test Album 2', itemCount: 5 },
            ];
          }
        };

        // 4. Mock the WIZ_global_data object that GPTK might need
        window.WIZ_global_data = {
          // Add any keys here that the script might depend on, even if empty.
          // This prevents "Cannot read properties of undefined" errors.
          oJ3XLc: 'some-value', // Example value
        };
      `
    });

    // Navigate to a blank page. We don't need a mock server or HTML file anymore.
    await page.goto('about:blank');

    // Inject our built userscript
    await page.addScriptTag({ path: 'dist/gpsf.user.js' });

    // Trigger the userscript's menu command
    await page.evaluate(() => window.gpsf_menu_command());

    // Assert that the UI container is visible
    await expect(page.locator('#gpsf-container')).toBeVisible();

    // Assert that the "Select All" checkbox is now visible, proving the fix
    await expect(page.locator('#gpsf-select-all-checkbox')).toBeVisible({ timeout: 2000 });

    // Interact with the checkbox to ensure it's functional
    await page.locator('#gpsf-select-all-checkbox').click();
    const allChecked = await page.evaluate(() => {
      const checkboxes = Array.from(document.querySelectorAll('#gpsf-source-albums input[type="checkbox"]:not(#gpsf-select-all-checkbox)'));
      return checkboxes.every(cb => cb.checked);
    });
    expect(allChecked).toBe(true);

    await context.close();
  });

  test('should display UI and show an error when GPTK API is not available (Sad Path)', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    // Add logging to see what's happening in the browser
    page.on('console', msg => console.log(`[BROWSER] ${msg.type()}: ${msg.text()}`));
    page.on('pageerror', error => console.error(`[BROWSER PAGE ERROR] ${error.message}`));

    // --- MOCKING STRATEGY (Sad Path) ---
    // We only mock the GM functions, but critically, we DO NOT mock the gptkApiUtils.
    // This simulates the real-world scenario where our script runs before GPTK is ready.
    await page.addInitScript({
      content: `
        window.E2E_TESTING = true;
        window.GM_registerMenuCommand = (name, fn) => {
          if (name === 'Start Google Photos Saved Finder') {
            window.gpsf_menu_command = fn;
          }
        };
        window.GM_info = {
          script: { name: 'GPSF', version: '0.0.0' },
          scriptHandler: 'Tampermonkey',
          version: '4.18.1'
        };
        // Note: unsafeWindow.gptkApiUtils is deliberately left undefined.
      `
    });

    // Navigate to a blank page
    await page.goto('about:blank');

    // Inject our built userscript
    await page.addScriptTag({ path: 'dist/gpsf.user.js' });

    // Trigger the userscript's menu command
    await page.evaluate(() => window.gpsf_menu_command());

    // Assert that the UI container is still visible, even with the error
    await expect(page.locator('#gpsf-container')).toBeVisible();

    // Assert that the "Select All" checkbox is NOT visible
    await expect(page.locator('#gpsf-select-all-checkbox')).not.toBeVisible();

    // Assert that the correct error message is displayed in the log
    const logArea = page.locator('#gpsf-log');
    await expect(logArea).toContainText('Error: GPTK API not found. Is the script installed and running?');

    await context.close();
  });
});
