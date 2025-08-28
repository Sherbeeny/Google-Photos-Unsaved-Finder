// ==UserScript==
// @name         Google Photos Saved Finder
// @namespace    https://github.com/Sherbeeny/Google-Photos-Saved-Finder#readme
// @version      2025.08.28-0553
// @description  A userscript that works with the Google Photos Toolkit (GPTK) to find photos in a specific album based on their 'saved' status and add them to another album for easy bulk actions.
// @author       Jules & Sherbeeny
// @match        *://photos.google.com/*
// @license      MIT
// @grant        GM_registerMenuCommand
// @grant        unsafeWindow
// @grant        GM_addStyle
// @run-at       document-idle
// @homepageURL  https://github.com/Sherbeeny/Google-Photos-Saved-Finder#readme
// @supportURL   https://github.com/Sherbeeny/Google-Photos-Saved-Finder/issues
// @updateURL    https://github.com/Sherbeeny/Google-Photos-Saved-Finder/releases/latest/download/gpsf.user.js
// @downloadURL  https://github.com/Sherbeeny/Google-Photos-Saved-Finder/releases/latest/download/gpsf.user.js
// ==/UserScript==
(function (exports) {
  'use strict';

  var uiHtml = "<!DOCTYPE html>\n<html>\n<head>\n  <title>Google Photos Saved Finder</title>\n  <style>\n    body {\n      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;\n      margin: 0;\n      padding: 16px;\n      background-color: #f5f5f5;\n      color: #202124;\n      width: 450px;\n    }\n    h2 {\n      font-size: 1.2rem;\n      margin: 0 0 4px 0;\n    }\n    h3 {\n      font-size: 0.9rem;\n      font-weight: 500;\n      color: #5f6368;\n      margin: 0 0 16px 0;\n    }\n    .section {\n      margin-bottom: 20px;\n    }\n    label {\n      display: block;\n      font-weight: 500;\n      margin-bottom: 6px;\n      font-size: 0.9rem;\n    }\n    input[type=\"text\"],\n    input[type=\"number\"],\n    select {\n      width: 100%;\n      padding: 8px;\n      border: 1px solid #ccc;\n      border-radius: 4px;\n      box-sizing: border-box;\n    }\n    .album-list-container {\n      border: 1px solid #ccc;\n      border-radius: 4px;\n      padding: 8px;\n      background-color: #fff;\n    }\n    #gpsf-source-albums {\n      list-style-type: none;\n      padding: 0;\n      margin: 0;\n      max-height: 150px;\n      overflow-y: auto;\n    }\n    #gpsf-source-albums li {\n      display: flex;\n      align-items: center;\n      padding: 4px 0;\n    }\n    #gpsf-source-albums li label {\n      margin-bottom: 0;\n      font-weight: normal;\n      margin-left: 6px;\n    }\n    .radio-group {\n      display: flex;\n      gap: 20px;\n    }\n    .radio-group label {\n      font-weight: normal;\n    }\n    .actions {\n      display: flex;\n      justify-content: flex-end;\n      gap: 12px;\n      margin-top: 20px;\n    }\n    button {\n      padding: 8px 16px;\n      border-radius: 4px;\n      border: 1px solid transparent;\n      cursor: pointer;\n      font-weight: 500;\n    }\n    button:disabled {\n      cursor: not-allowed;\n      opacity: 0.6;\n    }\n    #gpsf-start-button {\n      background-color: #1a73e8;\n      color: white;\n      border-color: #1a73e8;\n    }\n    #gpsf-cancel-button {\n      background-color: #e0e0e0;\n    }\n    .feedback {\n      margin-top: 16px;\n    }\n    progress {\n      width: 100%;\n      margin-top: 8px;\n      display: none;\n    }\n    .log-container {\n      height: 100px;\n      overflow-y: scroll;\n      border: 1px solid #ccc;\n      padding: 8px;\n      margin-top: 8px;\n      font-family: monospace;\n      font-size: 12px;\n      background-color: #fff;\n    }\n    .log-container .log-error {\n      color: #d93025;\n    }\n    .log-container .log-success {\n      color: #1e8e3e;\n    }\n  </style>\n</head>\n<body>\n  <h2 id=\"gpsf-dialog-title\">Google Photos Saved Finder</h2>\n  <h3 id=\"gpsf-subtitle\"></h3>\n\n  <div class=\"section\">\n    <label>Source Album(s)</label>\n    <div class=\"album-list-container\">\n      <ul id=\"gpsf-source-albums\">\n        <li>Loading albums...</li>\n      </ul>\n    </div>\n  </div>\n\n  <div class=\"section\">\n    <label>Filter Type</label>\n    <div class=\"radio-group\">\n      <label><input type=\"radio\" name=\"filter-type\" value=\"any\" checked> Any</label>\n      <label><input type=\"radio\" name=\"filter-type\" value=\"saved\"> Saved</label>\n      <label><input type=\"radio\" name=\"filter-type\" value=\"not-saved\"> Not Saved</label>\n    </div>\n  </div>\n\n  <div class=\"section\">\n    <label for=\"gpsf-destination-album-select\">Destination Album</label>\n    <select id=\"gpsf-destination-album-select\"></select>\n    <p style=\"text-align: center; margin: 8px 0;\">OR</p>\n    <label for=\"gpsf-destination-album-new\" style=\"margin-top: 0;\">Create New Album</label>\n    <input type=\"text\" id=\"gpsf-destination-album-new\" placeholder=\"Enter new album name...\">\n  </div>\n\n  <div class=\"section\">\n    <label for=\"gpsf-batch-size\">Batch Size</label>\n    <input type=\"number\" id=\"gpsf-batch-size\" value=\"20\" min=\"1\" max=\"100\">\n  </div>\n\n  <div class=\"feedback\">\n    <div id=\"gpsf-status\">Status: Idle</div>\n    <div id=\"gpsf-stats\" style=\"margin-top: 4px;\">Scanned: 0/0 | Matches: 0</div>\n    <progress id=\"gpsf-progress-bar\" value=\"0\" max=\"100\"></progress>\n    <div id=\"gpsf-log\" class=\"log-container\"></div>\n  </div>\n\n  <div id=\"gpsf-results-container\" style=\"display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 8px; margin-top: 16px;\"></div>\n\n  <div class=\"actions\">\n    <button id=\"gpsf-cancel-button\" disabled>Cancel</button>\n    <button id=\"gpsf-start-button\">Start</button>\n  </div>\n</body>\n</html>\n";

  // State variables
  let albums = [];
  let isProcessing = false;
  let isCancelled = false;

  // Element references
  let startButton, cancelButton, progressBar, uiContainer;

  const SCRIPT_NAME = 'Google Photos Saved Finder';

  /**
   * Creates a Trusted Types policy to allow injecting HTML.
   * This is necessary to work with Google's strict Content Security Policy.
   */
  function createTrustedPolicy () {
    if (window.trustedTypes && window.trustedTypes.createPolicy) {
      window.trustedTypes.createPolicy('default', {
        createHTML: (string) => string
      });
    }
  }

  /**
   * Awaits the appearance of an element in the DOM.
   * @param {string} selector The CSS selector to wait for.
   * @param {Document|Element} [root=document] The root element to search within.
   * @returns {Promise<Element>} A promise that resolves with the found element.
   */
  function waitForElement (selector, root = document) {
    return new Promise(resolve => {
      const el = root.querySelector(selector);
      if (el) {
        resolve(el);
        return
      }
      const observer = new MutationObserver(() => {
        const found = root.querySelector(selector);
        if (found) {
          observer.disconnect();
          resolve(found);
        }
      });
      observer.observe(root, { childList: true, subtree: true });
    })
  }

  /**
   * Populates the album lists in the UI.
   * @param {Array} albumList - The list of albums from the GPTK API.
   * @param {Document} doc The document to populate the lists in.
   */
  function populateAlbumLists (albumList, doc) {
    const sourceList = doc.getElementById('gpsf-source-albums');
    const destSelect = doc.getElementById('gpsf-destination-album-select');

    sourceList.innerHTML = '';
    destSelect.innerHTML = '<option value="" selected>Choose existing album...</option>';

    if (!albumList || albumList.length === 0) {
      sourceList.innerHTML = '<li>No albums found.</li>';
      return
    }

    const selectAllLi = doc.createElement('li');
    const selectAllCheckbox = doc.createElement('input');
    selectAllCheckbox.type = 'checkbox';
    selectAllCheckbox.id = 'gpsf-select-all-checkbox';
    const selectAllLabel = doc.createElement('label');
    selectAllLabel.htmlFor = 'gpsf-select-all-checkbox';
    selectAllLabel.textContent = ' Select All';
    selectAllLabel.style.fontWeight = 'bold';
    selectAllLi.appendChild(selectAllCheckbox);
    selectAllLi.appendChild(selectAllLabel);
    sourceList.appendChild(selectAllLi);

    albumList.forEach(album => {
      const checkboxId = `gpsf-album-${album.mediaKey}`;
      const li = doc.createElement('li');
      const checkbox = doc.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = checkboxId;
      checkbox.value = album.mediaKey;
      checkbox.dataset.title = album.title;
      const label = doc.createElement('label');
      label.htmlFor = checkboxId;
      label.textContent = ` ${album.title} (${album.itemCount})`;
      li.appendChild(checkbox);
      li.appendChild(label);
      sourceList.appendChild(li);

      const option = doc.createElement('option');
      option.value = album.mediaKey;
      option.textContent = `${album.title} (${album.itemCount})`;
      destSelect.appendChild(option);
    });
  }

  /**
    * Fetches all albums using the GPTK API and populates the UI.
    * @param {Document} doc The document to populate the lists in.
    */
  async function loadAlbums (doc) {
    log('Loading albums...', doc);
    try {
      albums = await unsafeWindow.gptkApiUtils.getAllAlbums();
      albums.sort((a, b) => a.title.localeCompare(b.title));
      populateAlbumLists(albums, doc);
      log(`${albums.length} albums loaded successfully.`, doc, 'success');
    } catch (error) {
      console.error(`${SCRIPT_NAME}: Failed to load albums.`, error);
      log('Error loading albums. Is GPTK running?', doc, 'error');
    }
  }

  /**
   * Hides the main UI.
   */
  function hideUI() {
      if (uiContainer) {
          uiContainer.style.display = 'none';
      }
  }

  /**
   * Shows the main UI.
   * @param {string} email The user's email address.
   */
  function showUI (email) {
      if (!uiContainer) {
          uiContainer = document.createElement('div');
          uiContainer.id = 'gpsf-container';
          uiContainer.innerHTML = uiHtml;
          document.body.appendChild(uiContainer);

          // Get element references
          startButton = document.getElementById('gpsf-start-button');
          cancelButton = document.getElementById('gpsf-cancel-button');
          progressBar = document.getElementById('gpsf-progress-bar');

          // Add event listeners and load initial data
          addEventListeners(document);
          loadAlbums(document);
      }

      uiContainer.style.display = 'block';
      const subtitleEl = document.getElementById('gpsf-subtitle');
      if (subtitleEl) {
          subtitleEl.textContent = `For account: ${email}`;
      }
  }

  /**
   * Logs a message to the log area in the UI.
   * @param {string} message The message to log.
   * @param {Document} doc The document to log to.
   */
  function log (message, doc, type = 'info') {
    const logArea = doc.getElementById('gpsf-log');
    if (!logArea) return
    const entry = doc.createElement('div');
    entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    if (type === 'error') entry.style.color = '#d93025';
    if (type === 'success') entry.style.color = '#1e8e3e';
    logArea.appendChild(entry);
    logArea.scrollTop = logArea.scrollHeight;
  }

  /**
   * Updates the feedback area in the UI.
   * @param {string} status The status message to display.
   * @param {Document} doc The document to update.
   */
  function updateFeedback (status, doc, scanned = 0, total = 0, matches = 0) {
    doc.getElementById('gpsf-status').textContent = `Status: ${status}`;
    doc.getElementById('gpsf-stats').textContent = `Scanned: ${scanned}/${total} | Matches: ${matches}`;

    if (total > 0 && scanned > 0 && scanned <= total) {
      progressBar.style.display = 'block';
      progressBar.max = total;
      progressBar.value = scanned;
    } else {
      progressBar.style.display = 'none';
    }
  }

  /**
   * Resets the UI to its initial state.
   * @param {Document} doc The document to reset.
   */
  function resetUIState (doc) {
    startButton.disabled = false;
    cancelButton.disabled = true;
    const logArea = doc.getElementById('gpsf-log');
    logArea.innerHTML = '';
    updateFeedback('Idle', doc);
  }

  /**
   * Gets all media items from the selected source albums.
   * @param {Document} doc The document to get the selected albums from.
   */
  async function getSourceMediaItems (doc) {
    const sourceCheckboxes = doc.querySelectorAll('#gpsf-source-albums input[type="checkbox"]:not(#gpsf-select-all-checkbox):checked');
    if (sourceCheckboxes.length === 0) {
      log('No source albums selected.', doc, 'error');
      return null
    }
    const allItems = [];
    const itemKeys = new Set();
    updateFeedback('Fetching media items...', doc);
    for (const checkbox of sourceCheckboxes) {
      if (isCancelled) return null
      const albumId = checkbox.value;
      const albumTitle = checkbox.dataset.title;
      log(`Fetching items from album: "${albumTitle}"...`, doc);
      try {
        const items = await unsafeWindow.gptkApiUtils.getAllMediaInAlbum(albumId);
        items.forEach(item => {
          if (!itemKeys.has(item.mediaKey)) {
            itemKeys.add(item.mediaKey);
            allItems.push(item);
          }
        });
        log(`Found ${items.length} items in "${albumTitle}". Total unique items so far: ${allItems.length}`, doc);
      } catch (error) {
        log(`Error fetching items from album "${albumTitle}": ${error.message}`, doc, 'error');
      }
    }
    return allItems
  }

  /**
   * Processes batches of media items to find saved photos.
   * @param {Array} items The media items to process.
   * @param {string} filterType The type of filter to apply ('any', 'saved', 'not-saved').
   * @param {Document} doc The document to update the feedback in.
   */
  async function processBatches (items, filterType, doc, batchSize) {
    const matchedItems = [];
    let scannedCount = 0;
    const totalCount = items.length;
    for (let i = 0; i < totalCount; i += batchSize) {
      if (isCancelled) return null
      const batch = items.slice(i, i + batchSize);
      updateFeedback(`Processing batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(totalCount / batchSize)}...`, doc, scannedCount, totalCount, matchedItems.length);
      const promises = batch.map(item => unsafeWindow.gptkApi.getItemInfo(item.mediaKey));
      const results = await Promise.all(promises);
      scannedCount += batch.length;
      results.forEach(itemInfo => {
        if (!itemInfo) return
        const isSaved = itemInfo.savedToYourPhotos;
        if (filterType === 'any' || (filterType === 'saved' && isSaved) || (filterType === 'not-saved' && !isSaved)) {
          matchedItems.push(itemInfo);
        }
      });
      log(`Batch processed. Scanned: ${scannedCount}/${totalCount}. Matches found: ${matchedItems.length}.`, doc);
    }
    return matchedItems
  }

  /**
   * Renders the matched photos in the UI.
   * @param {Array} items The matched media items to render.
   * @param {Document} doc The document to render the results in.
   */
  function renderResults (items, doc) {
    const resultsContainer = doc.getElementById('gpsf-results-container');
    resultsContainer.innerHTML = '';
    if (items.length === 0) {
      resultsContainer.innerHTML = '<p>No matching photos found.</p>';
      return
    }
    items.forEach(item => {
      const img = doc.createElement('img');
      img.src = item.url;
      img.title = item.filename;
      resultsContainer.appendChild(img);
    });
  }

  /**
   * Adds the matched photos to a new or existing album.
   * @param {Array} matchedItems The media items to add to the album.
   * @param {Document} doc The document to get the destination album from.
   */
  async function addToAlbum (matchedItems, doc) {
    const destSelect = doc.getElementById('gpsf-destination-album-select');
    const newAlbumName = doc.getElementById('gpsf-destination-album-new').value.trim();
    let destinationAlbumId = destSelect.value;
    if (!destinationAlbumId && !newAlbumName) {
      log('No destination album selected or new album name provided.', doc, 'error');
      return
    }
    try {
      if (newAlbumName) {
        log(`Creating new album: "${newAlbumName}"...`, doc);
        updateFeedback('Creating new album...', doc);
        destinationAlbumId = await unsafeWindow.gptkApi.createAlbum(newAlbumName);
        log(`Album "${newAlbumName}" created successfully.`, doc, 'success');
      }
      if (!destinationAlbumId) return
      log(`Adding ${matchedItems.length} items to destination album...`, doc);
      updateFeedback(`Adding ${matchedItems.length} items...`, doc);
      await unsafeWindow.gptkApiUtils.addToExistingAlbum(matchedItems.map(item => item.mediaKey), destinationAlbumId);
      log(`${matchedItems.length} items successfully added.`, doc, 'success');
      updateFeedback('Process Complete!', doc, matchedItems.length, matchedItems.length, matchedItems.length);
    } catch (error) {
      log(`Error adding items to album: ${error.message}`, doc, 'error');
      updateFeedback('Error!', doc);
    }
  }

  /**
   * Starts the process of finding saved photos.
   * @param {Document} doc The document to work with.
   */
  async function startProcess (doc) {
    if (isProcessing) return
    isProcessing = true;
    isCancelled = false;
    resetUIState(doc);
    startButton.disabled = true;
    cancelButton.disabled = false;
    log('Starting process...', doc);
    const mediaItems = await getSourceMediaItems(doc);
    if (!mediaItems || mediaItems.length === 0 || isCancelled) {
      log('No media items to process or process cancelled.', doc, 'info');
      isProcessing = false;
      resetUIState(doc);
      return
    }
    const filterType = doc.querySelector('input[name="filter-type"]:checked').value;
    const batchSize = parseInt(doc.getElementById('gpsf-batch-size').value, 10) || 20;
    const matchedItems = await processBatches(mediaItems, filterType, doc, batchSize);
    if (isCancelled) {
      log('Process cancelled by user.', doc, 'info');
    } else if (matchedItems && matchedItems.length > 0) {
      log(`Processing complete. Found ${matchedItems.length} matches.`, doc, 'success');
      renderResults(matchedItems, doc);
      await addToAlbum(matchedItems, doc);
    } else {
      log('Processing complete. No matches found.', doc, 'info');
      updateFeedback('Complete. No matches found.', doc, mediaItems.length, mediaItems.length, 0);
    }
    isProcessing = false;
    resetUIState(doc);
  }

  /**
   * Cancels the current process.
   * @param {Document} doc The document to update the UI in.
   */
  function cancelProcess (doc) {
    if (!isProcessing) return
    isCancelled = true;
    cancelButton.disabled = true;
    log('Cancellation requested. The process will stop after the current batch.', doc, 'info');
    updateFeedback('Cancelling...', doc);
  }

  /**
   * Adds event listeners to the UI elements.
   * @param {Document} doc The document to add the event listeners to.
   */
  function addEventListeners (doc) {
    doc.getElementById('gpsf-start-button').addEventListener('click', () => startProcess(doc));
    doc.getElementById('gpsf-cancel-button').addEventListener('click', () => {
        cancelProcess(doc);
        hideUI();
    });
    doc.getElementById('gpsf-select-all-checkbox').addEventListener('change', (event) => {
      const checkboxes = doc.querySelectorAll('#gpsf-source-albums input[type="checkbox"]:not(#gpsf-select-all-checkbox)');
      checkboxes.forEach(checkbox => {
        checkbox.checked = event.target.checked;
      });
    });
  }

  // Self-executing anonymous function for the final userscript
  (async function () {
    if (typeof unsafeWindow === 'undefined') {
      window.unsafeWindow = window;
    }

    // Create a Trusted Types policy to allow injecting our UI HTML.
    createTrustedPolicy();

    if (typeof GM_info !== 'undefined' && GM_info.scriptHandler === 'Tampermonkey') {
      // In the live userscript, wait for GPTK and the user account to be ready.
      try {
        await waitForElement('#gptk-button');
        const anchor = await waitForElement('a[aria-label^="Google Account:"]');
        const label = anchor.getAttribute('aria-label') || '';
        const match = label.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
        const email = match ? match[1] : 'Unknown Account';

        if (unsafeWindow.gptkCore) unsafeWindow.gptkCore.isProcessRunning = false;
        GM_registerMenuCommand('Start Google Photos Saved Finder', () => showUI(email));
      } catch (error) {
        console.error(`${SCRIPT_NAME}: Failed to initialize.`, error);
        alert(`${SCRIPT_NAME}: Could not initialize. Is Google Photos Toolkit (GPTK) installed and active?`);
      }
    } else if (window.E2E_TESTING) {
      // In the E2E test environment, just run the UI directly.
      showUI('test@example.com');
    }
  })();

  exports.loadAlbums = loadAlbums;
  exports.populateAlbumLists = populateAlbumLists;
  exports.showUI = showUI;
  exports.startProcess = startProcess;

  return exports;

})({});
