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

  // 3. Navigate to a blank page to create a clean environment.
  await page.goto('about:blank');

  // 4. Mock the necessary Tampermonkey environment.
  await page.evaluate(() => {
    window.unsafeWindow = {
        WIZ_global_data: {
            Dbw5Ud: 'rapt_token',
            oPEP7c: 'account_id',
            FdrFJe: 'f.sid_token',
            cfb2h: 'bl_token',
            eptZe: '/_/PhotosUi',
            SNlM0e: 'at_token',
        }
    };
    window.GM_addStyle = () => {};
    window.GM_registerMenuCommand = (name, fn) => {
      fn();
    };
     window.fetch = async () => ({
        ok: true,
        text: async () => `)]}'\n[null,null,"[]"]`,
     });
  });

  // 5. Inject and execute the userscript.
  await page.evaluate(userscriptContent);

  // 6. Assert that no TrustedHTML or related CSP errors were logged.
  const hasTrustedHTMLError = consoleErrors.some(error =>
    error.includes('TrustedHTML') || error.includes('Content Security Policy')
  );

  expect(hasTrustedHTMLError).toBe(false, `A TrustedHTML or CSP error was found in the console: ${consoleErrors.join(', ')}`);
});
