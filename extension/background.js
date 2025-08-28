const gptkUrl = 'https://127.0.0.1:8080/gptk.test.user.js';
const savedFinderUrl = 'https://127.0.0.1:8080/saved-finder.user.js';

// Note: onStartup fires when the browser is first launched.
// In a persistent context test, this might only run on the very first launch.
// This is the desired behavior for installing scripts.
chrome.runtime.onStartup.addListener(() => {
  console.log('E2E Installer: onStartup event received. Opening userscript tabs for installation.');
  // We don't need to check if they are already open, Tampermonkey handles already-installed scripts gracefully.
  chrome.tabs.create({ url: gptkUrl });
  chrome.tabs.create({ url: savedFinderUrl });
});

// For convenience during development, let's also add a browser action
// to trigger the installation manually if needed, since onStartup is hard to trigger repeatedly.
chrome.action.onClicked.addListener(() => {
    console.log('E2E Installer: Action clicked. Opening userscript tabs for installation.');
    chrome.tabs.create({ url: gptkUrl });
    chrome.tabs.create({ url: savedFinderUrl });
});
