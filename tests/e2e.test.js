import { test, expect } from '@playwright/test';
import { start as startServer, stop as stopServer } from './server.js';
import fs from 'fs';

const MOCK_URL = 'https://photos.google.com/';

test.describe('Google Photos Saved Finder E2E', () => {
  // Start and stop the server once for all tests in this file.
  test.beforeAll(async () => {
    await startServer();
  });

  test.afterAll(async () => {
    await stopServer();
  });

  test('should load the userscript and find the hidden bug', async ({ browser }) => {
    const context = await browser.newContext({
      ignoreHTTPSErrors: true, // Necessary for our self-signed certificate
    });
    const page = await context.newPage();

    // Log all console messages from the browser for debugging
    page.on('console', msg => console.log(`[Browser Console] ${msg.type()}: ${msg.text()}`));

    // Inject mock scripts before navigating
    await page.addInitScript({ content: 'window.E2E_TESTING = true;' });
    await page.addInitScript({ path: 'mocks/wiz-data.js' });

    // Mock Greasemonkey APIs
    await page.addInitScript({
      content: `
        window.GM_registerMenuCommand = (name, fn) => {
          // Capture the function passed by our userscript, so we can call it later.
          if (name === 'Start Google Photos Saved Finder') {
            window.gpsf_menu_command = fn;
          }
        };
        window.GM_info = {
          script: { name: 'GPSF', version: '0.0.0' },
          scriptHandler: 'Tampermonkey',
          version: '4.18.1'
        };
      `
    });

    // Set up network mocking to only serve the mock HTML page.
    await page.route(MOCK_URL, (route) => {
      return route.fulfill({ path: 'mocks/photos.html' });
    });

    // Navigate to the page
    await page.goto(MOCK_URL);

    // Manually define unsafeWindow for the userscripts
    await page.evaluate(() => { window.unsafeWindow = window; });

    // Inject the main GPTK script
    await page.addScriptTag({ path: 'scripts/gptk.original.user.js' });

    // Inject our script
    await page.addScriptTag({ path: 'dist/gpsf.user.js' });

    // Wait for the GPTK button to appear. This is the key signal.
    await expect(page.locator('#gptk-button')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('a[aria-label^="Google Account:"]')).toBeVisible({ timeout: 10000 });

    // NOW, inject the mock API that our script depends on.
    // This proves that our script waits for the button and doesn't fail if the API is delayed.
    await page.addScriptTag({ path: 'mocks/gptk-api.js' });

    // Trigger the menu command function we captured in our mock
    await page.evaluate(() => window.gpsf_menu_command());

    // The final assertion: Check if the UI is visible and interactive
    await expect(page.locator('#gpsf-container')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#gpsf-start-button')).toBeEnabled({ timeout: 1000 });

    await context.close();
  });
});
