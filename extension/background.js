const gptkScriptUrl = 'https://127.0.0.1:8443/gptk.test.user.js';
const unsavedFinderScriptUrl = 'https://127.0.0.1:8443/src/google_photos_unsaved_finder.user.js';

// Using onInstalled is more suitable for a one-time setup when the extension is loaded in a test.
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    console.log('Installer extension installed. Opening userscript tabs...');

    // We need to handle the case where the browser blocks popups.
    // Opening them one by one might be more reliable.
    try {
      await chrome.tabs.create({ url: gptkScriptUrl, active: false });
      console.log(`Opened tab for: ${gptkScriptUrl}`);

      await chrome.tabs.create({ url: unsavedFinderScriptUrl, active: false });
      console.log(`Opened tab for: ${unsavedFinderScriptUrl}`);
    } catch (error) {
      console.error('Error opening tabs:', error);
    }
  }
});

// Log for debugging purposes
console.log("Installer service worker started.");
