const { test, expect, _chromium } = require('@playwright/test');
const path = require('path');
const { fork } = require('child_process');

const EXTENSION_PATH = path.join(__dirname, '..', 'extension');
const TAMPERMONKEY_PATH = path.join(__dirname, '..', 'tampermonkey', 'unpacked');
const USER_DATA_DIR = path.join(__dirname, '..', 'test-user-data');

let serverProcess;

// Hook to start the server before all tests
test.beforeAll(async () => {
  const serverPath = path.join(__dirname, '..', 'tools', 'serve-photos.js');
  console.log('Starting mock server...');
  serverProcess = fork(serverPath, [], { silent: true });
  await new Promise((resolve, reject) => {
    serverProcess.stdout.on('data', (data) => {
      console.log(`[Server STDOUT]: ${data}`);
      if (data.toString().includes('Mock HTTPS server running')) {
        console.log('Server started successfully.');
        resolve();
      }
    });
    serverProcess.stderr.on('data', (data) => {
      console.error(`[Server STDERR]: ${data}`);
      reject(new Error(`Server failed to start: ${data}`));
    });
  });
});

// Hook to stop the server after all tests
test.afterAll(() => {
  console.log('Stopping mock server...');
  serverProcess.kill();
});


test.describe('Integration Test with Tampermonkey', () => {
  let context;
  let page;

  test.beforeEach(async () => {
    // Launch a persistent browser context
    context = await _chromium.launchPersistentContext(USER_DATA_DIR, {
      headless: false, // Run in headful mode to observe the browser
      args: [
        `--disable-extensions-except=${TAMPERMONKEY_PATH},${EXTENSION_PATH}`,
        `--load-extension=${TAMPERMONKEY_PATH},${EXTENSION_PATH}`,
        '--host-rules=MAP photos.google.com 127.0.0.1:8443',
        '--ignore-certificate-errors',
      ],
    });

    page = await context.newPage();

    // --- Handle Userscript Installation ---
    // The helper extension opens tabs to install the scripts.
    // We need to find those tabs and click the "Install" button.

    // Wait for the Tampermonkey installation tab for gptk.test.user.js
    const gptkInstallPage = await context.waitForEvent('page', {
        predicate: p => p.url().includes('gptk.test.user.js')
    });
    await gptkInstallPage.waitForLoadState();
    console.log('Found GPTK installation page.');
    await gptkInstallPage.click('input[type="submit"][value="Install"]');
    console.log('Clicked install for GPTK.');

    // Wait for the Tampermonkey installation tab for our script
    const finderInstallPage = await context.waitForEvent('page', {
        predicate: p => p.url().includes('google_photos_saved_finder.user.js')
    });
    await finderInstallPage.waitForLoadState();
    console.log('Found Unsaved Finder installation page.');
    await finderInstallPage.click('input[type="submit"][value="Install"]');
    console.log('Clicked install for Unsaved Finder.');

    // Close the installation tabs
    await gptkInstallPage.close();
    await finderInstallPage.close();
  });

  test.afterEach(async () => {
    await context.close();
  });

  test('Harness Sanity Check: should show the GPTK button', async () => {
    // Navigate to the mock Google Photos page
    await page.goto('https://photos.google.com/photos.html');

    // The primary success condition for the harness: GPTK button is visible
    const gptkButton = page.locator('#gptk-button');
    await expect(gptkButton).toBeVisible({ timeout: 15000 });
    console.log('GPTK button is visible. Test harness is working.');
  });

  test('Bug Reproduction: should fail to show the Unsaved Finder UI on startup', async () => {
    // Navigate to the mock Google Photos page
    await page.goto('https://photos.google.com/photos.html');

    // Wait for the GPTK button to ensure the page is ready
    const gptkButton = page.locator('#gptk-button');
    await expect(gptkButton).toBeVisible({ timeout: 15000 });

    // Click the GPTK button to open its main UI
    await gptkButton.click();

    // Now, try to find our userscript's UI.
    // This is expected to FAIL by timing out, because of the silent crash bug.
    const finderWindow = page.locator('.gpf-window');

    // We expect it NOT to be visible within a short timeout.
    // This confirms the bug. A passing test here means the bug is present.
    await expect(finderWindow).not.toBeVisible({ timeout: 5000 });
    console.log('Unsaved Finder UI did not appear, successfully reproducing the silent crash bug.');
  });
});
