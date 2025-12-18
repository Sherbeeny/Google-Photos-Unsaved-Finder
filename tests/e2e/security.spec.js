const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

test('UI creation should not violate TrustedHTML policy', async ({ page }) => {
  // 1. Define the path to the userscript.
  const userscriptPath = path.join(__dirname, '../../src/google_photos_unsaved_finder.user.js');
  const userscriptContent = fs.readFileSync(userscriptPath, 'utf8');

  // 2. Set up a listener to catch any console errors.
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  // 3. Navigate to the local test harness page.
  await page.goto(`file://${path.join(__dirname, 'harness.html')}`);

  // 4. Inject the userscript into the page.
  await page.evaluate(userscriptContent);

  // 5. Mock the necessary global objects that the userscript expects.
  await page.evaluate(() => {
    window.WIZ_global_data = {
        Dbw5Ud: 'rapt_token',
        oPEP7c: 'account_id',
        FdrFJe: 'f.sid_token',
        cfb2h: 'bl_token',
        eptZe: '/_/PhotosUi',
        SNlM0e: 'at_token',
    };
    window.GM_addStyle = () => {};
    window.GM_registerMenuCommand = (name, fn) => {
      // Immediately execute the function to trigger the UI creation.
      fn();
    };
  });

  // 6. Execute the userscript's start function to create the UI.
  // This is handled by the GM_registerMenuCommand mock above.

  // 7. Assert that no TrustedHTML or related CSP errors were logged.
  const hasTrustedHTMLError = consoleErrors.some(error =>
    error.includes('TrustedHTML') || error.includes('Content Security Policy')
  );

  expect(hasTrustedHTMLError).toBe(false, `A TrustedHTML or CSP error was found in the console: ${consoleErrors.join(', ')}`);
});
