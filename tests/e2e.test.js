import { test, expect } from '@playwright/test';

test.describe('Google Photos Saved Finder E2E', () => {
  test('should display UI and load albums when GPTK API is available (Happy Path)', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    page.on('console', msg => console.log(`[BROWSER] ${msg.type()}: ${msg.text()}`));
    page.on('pageerror', error => console.error(`[BROWSER PAGE ERROR] ${error.message}`));

    await page.addInitScript({
      content: `
        window.E2E_TESTING = true;
        window.GM_registerMenuCommand = (name, fn) => { window.gpsf_menu_command = fn; };
        window.GM_info = { script: { name: 'GPSF' }, scriptHandler: 'Tampermonkey' };
        window.unsafeWindow = window;
        window.unsafeWindow.gptkApiUtils = {
          getAllAlbums: async () => {
            console.log('[E2E MOCK] gptkApiUtils.getAllAlbums called.');
            // Introduce a small delay to make the "Loading..." state testable
            await new Promise(resolve => setTimeout(resolve, 200));
            return [
              { mediaKey: 'album1', title: 'Test Album 1', itemCount: 10 },
              { mediaKey: 'album2', title: 'Test Album 2', itemCount: 5 },
            ];
          }
        };
      `
    });

    await page.goto('about:blank');
    await page.addScriptTag({ path: 'dist/gpsf.user.js' });
    await page.evaluate(() => window.gpsf_menu_command());

    await expect(page.locator('#gpsf-container')).toBeVisible();
    await expect(page.locator('#gpsf-source-albums')).toContainText('Loading albums...');

    await expect(page.locator('#gpsf-select-all-checkbox')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('#gpsf-source-albums')).toContainText('Test Album 1');
    await expect(page.locator('#gpsf-source-albums')).not.toContainText('Loading albums...');

    await context.close();
  });

  test('should display UI and show an error when GPTK API is not available (Sad Path)', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    page.on('console', msg => console.log(`[BROWSER] ${msg.type()}: ${msg.text()}`));
    page.on('pageerror', error => console.error(`[BROWSER PAGE ERROR] ${error.message}`));

    await page.addInitScript({
      content: `
        window.E2E_TESTING = true;
        window.GM_registerMenuCommand = (name, fn) => { window.gpsf_menu_command = fn; };
        window.GM_info = { script: { name: 'GPSF' }, scriptHandler: 'Tampermonkey' };
        // Note: unsafeWindow.gptkApiUtils is deliberately left undefined.
      `
    });

    await page.goto('about:blank');
    await page.addScriptTag({ path: 'dist/gpsf.user.js' });
    await page.evaluate(() => window.gpsf_menu_command());

    await expect(page.locator('#gpsf-container')).toBeVisible();
    await expect(page.locator('#gpsf-source-albums')).toContainText('Loading albums...');

    const logArea = page.locator('#gpsf-log');
    await expect(logArea).toContainText('TypeError: Cannot read properties of undefined', { timeout: 3000 });

    await expect(page.locator('#gpsf-source-albums')).toContainText('No albums found');
    await expect(page.locator('#gpsf-source-albums')).not.toContainText('Loading albums...');

    await context.close();
  });
});
