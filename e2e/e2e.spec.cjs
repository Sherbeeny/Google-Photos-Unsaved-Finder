const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

test.describe('Google Photos Saved Finder', () => {
  let page;
  let popup;

  test.beforeEach(async ({ browser }) => {
    test.setTimeout(60000);
    page = await browser.newPage();
    // Build the script first
    console.log('Building userscript...');
    const { execSync } = require('child_process');
    execSync('npm run build');
    console.log('Build complete.');

    const userscript = fs.readFileSync(path.resolve(__dirname, '../dist/gpsf.user.js'), 'utf8');
    await page.goto('https://photos.google.com/u/0/');
    await page.evaluate(() => {
      window.E2E_TESTING = true;
      window.unsafeWindow = window;
      window.gptkApi = {
        getItemInfo: (mediaKey) => {
          if (mediaKey === 'item1') {
            return Promise.resolve({ mediaKey: 'item1', url: 'https://lh3.googleusercontent.com/12345', savedToYourPhotos: true });
          }
          return Promise.resolve({ mediaKey: 'item2', url: 'https://lh3.googleusercontent.com/67890', savedToYourPhotos: false });
        }
      };
      window.gptkApiUtils = {
        getAllAlbums: () => Promise.resolve([
          { mediaKey: 'album1', title: 'Test Album', itemCount: 2 }
        ]),
        getAllMediaInAlbum: () => Promise.resolve([
          { mediaKey: 'item1' },
          { mediaKey: 'item2' }
        ]),
        addToExistingAlbum: () => Promise.resolve(),
        createAlbum: () => Promise.resolve('new-album-id'),
      };
    });

    // The userscript opens a popup, so we need to handle it
    [popup] = await Promise.all([
        page.waitForEvent('popup'),
        page.addScriptTag({ content: userscript }),
    ]);

    await popup.waitForLoadState();

    // Wait for the UI to be injected and the dialog to be open
    await popup.waitForSelector('#gpsf-dialog-title', { state: 'visible', timeout: 60000 });
  });

  test('should find saved photos', async () => {
    // Select the "Saved" filter
    await popup.check('input[value="saved"]');

    // Select the album
    await popup.waitForSelector('#gpsf-album-album1');
    await popup.check('#gpsf-album-album1');

    // Click the "Find" button
    await popup.click('#gpsf-start-button');

    // Wait for the results to appear
    await popup.waitForSelector('#gpsf-results-container .photo-grid-item', { timeout: 30000 });

    // Check if the results are correct
    const photoUrls = await popup.evaluate(() => {
      const images = Array.from(document.querySelectorAll('#gpsf-results-container .photo-grid-item img'));
      return images.map(img => img.src);
    });
    console.log('Found photo URLs:', photoUrls);

    expect(photoUrls).toHaveLength(1);
    expect(photoUrls[0]).toMatch(/^https:\/\/lh3\.googleusercontent\.com\/12345/);
  });

  test('should find not-saved photos', async () => {
    // Select the "Not Saved" filter
    await popup.check('input[value="not-saved"]');

    // Select the album
    await popup.waitForSelector('#gpsf-album-album1');
    await popup.check('#gpsf-album-album1');

    // Click the "Find" button
    await popup.click('#gpsf-start-button');

    // Wait for the results to appear
    await popup.waitForSelector('#gpsf-results-container .photo-grid-item', { timeout: 30000 });

    // Check if the results are correct
    const photoUrls = await popup.evaluate(() => {
      const images = Array.from(document.querySelectorAll('#gpsf-results-container .photo-grid-item img'));
      return images.map(img => img.src);
    });
    console.log('Found photo URLs:', photoUrls);

    expect(photoUrls).toHaveLength(1);
    expect(photoUrls[0]).toMatch(/^https:\/\/lh3\.googleusercontent\.com\/67890/);
  });
});
