const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

test.describe('Google Photos Saved Finder', () => {
  let page;
  let popup;

  test.beforeEach(async ({ browser }) => {
    test.setTimeout(60000);
    page = await browser.newPage();

    // Log console messages for debugging
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));

    console.log('Building userscript...');
    const { execSync } = require('child_process');
    execSync('npm run build');
    console.log('Build complete.');

    const userscript = fs.readFileSync(path.resolve(__dirname, '../dist/gpsf.user.js'), 'utf8');

    await page.goto('about:blank');

    // Set up the mock environment on the main page
    await page.evaluate(() => {
      window.E2E_TESTING = true;
      window.unsafeWindow = window;
      window.gptkApi = {
        getItemInfo: (mediaKey) => {
          if (mediaKey === 'item1') {
            return Promise.resolve({ mediaKey: 'item1', filename: 'saved.jpg', url: 'https://lh3.googleusercontent.com/12345', savedToYourPhotos: true });
          }
          return Promise.resolve({ mediaKey: 'item2', filename: 'not-saved.jpg', url: 'https://lh3.googleusercontent.com/67890', savedToYourPhotos: false });
        }
      };
      window.gptkApiUtils = {
        getAllAlbums: () => {
          console.log('Mock getAllAlbums called');
          return Promise.resolve([
            { mediaKey: 'album1', title: 'Test Album', itemCount: 2 }
          ]);
        },
        getAllMediaInAlbum: () => Promise.resolve([
          { mediaKey: 'item1' },
          { mediaKey: 'item2' }
        ]),
        addToExistingAlbum: () => Promise.resolve(),
        createAlbum: () => Promise.resolve('new-album-id'),
      };
    });

    // Run the userscript, which opens the popup directly in test mode
    const popupPromise = page.waitForEvent('popup');
    await page.addScriptTag({ content: userscript });
    popup = await popupPromise;

    // Log console messages from the popup for debugging
    popup.on('console', msg => console.log('POPUP LOG:', msg.text()));

    await popup.waitForLoadState();

    // Wait for the album list to be populated, which is the best signal that the UI is ready
    await popup.waitForSelector('#gpsf-album-album1', { state: 'visible', timeout: 30000 });
  });

  test('should find saved photos', async () => {
    // Select the "Saved" filter
    await popup.check('input[value="saved"]');

    // Select the album
    await popup.check('#gpsf-album-album1');

    // Click the "Start" button
    await popup.click('#gpsf-start-button');

    // Wait for the results to appear
    await popup.waitForSelector('#gpsf-results-container img', { timeout: 30000 });

    // Check if the results are correct
    const photoUrls = await popup.evaluate(() => {
      const images = Array.from(document.querySelectorAll('#gpsf-results-container img'));
      return images.map(img => img.src);
    });
    console.log('Found photo URLs:', photoUrls);

    expect(photoUrls).toHaveLength(1);
    expect(photoUrls[0]).toBe('https://lh3.googleusercontent.com/12345');
  });

  test('should find not-saved photos', async () => {
    // Select the "Not Saved" filter
    await popup.check('input[value="not-saved"]');

    // Select the album
    await popup.check('#gpsf-album-album1');

    // Click the "Start" button
    await popup.click('#gpsf-start-button');

    // Wait for the results to appear
    await popup.waitForSelector('#gpsf-results-container img', { timeout: 30000 });

    // Check if the results are correct
    const photoUrls = await popup.evaluate(() => {
      const images = Array.from(document.querySelectorAll('#gpsf-results-container img'));
      return images.map(img => img.src);
    });
    console.log('Found photo URLs:', photoUrls);

    expect(photoUrls).toHaveLength(1);
    expect(photoUrls[0]).toBe('https://lh3.googleusercontent.com/67890');
  });
});
