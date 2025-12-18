// ==UserScript==
// @name         Google Photos Unsaved Finder
// @namespace    http://tampermonkey.net/
// @version      2025.12.19-0018
// @description  A userscript to find unsaved photos in Google Photos albums.
// @author       Sherbeeny (via Jules the AI Agent)
// @match        https://photos.google.com/*
// @noframes
// @grant        GM_registerMenuCommand
// @grant        GM_addStyle
// @grant        GM_info
// @grant        unsafeWindow
// ==/UserScript==

(function() {
    'use strict';

    // This function remains coupled to the browser, but it's called only once at the top level.
    const getWindowGlobalData = () => ({
      rapt: unsafeWindow.WIZ_global_data.Dbw5Ud,
      account: unsafeWindow.WIZ_global_data.oPEP7c,
      'f.sid': unsafeWindow.WIZ_global_data.FdrFJe,
      bl: unsafeWindow.WIZ_global_data.cfb2h,
      path: unsafeWindow.WIZ_global_data.eptZe,
      at: unsafeWindow.WIZ_global_data.SNlM0e,
    });

    function assertType(variable, expectedType) {
      const actualType = typeof variable;
      if (actualType !== expectedType) {
        throw new TypeError(`Expected type ${expectedType} but got ${actualType}`);
      }
    }

    // --- Data Parsing Functions (Pure) ---
    function albumParse(itemData) {
      return {
        mediaKey: itemData?.[0],
        title: itemData?.at(-1)?.[72930366]?.[1],
        isShared: itemData?.at(-1)?.[72930366]?.[4] || false,
      };
    }

    function albumsPage(data) {
      return {
        items: data?.[0]?.map((itemData) => albumParse(itemData)),
        nextPageId: data?.[1],
      };
    }
    function albumItemParse(itemData) {
      return {
        mediaKey: itemData?.[0],
      };
    }
    function albumItemsPage(data) {
      return {
        items: data?.[1]?.map((itemData) => albumItemParse(itemData)),
        nextPageId: data?.[2],
      };
    }
    function itemInfoParse(itemData) {
      return {
        mediaKey: itemData[0]?.[0],
        savedToYourPhotos: itemData[0]?.[15]?.[163238866]?.length > 0,
      };
    }
    function parser(data, rpcid) {
      if (rpcid === 'Z5xsfc') return albumsPage(data);
      if (rpcid === 'snAcKc') return albumItemsPage(data);
      if (rpcid === 'VrseUb') return itemInfoParse(data);
      return null;
    }

    // --- Core API Logic (Now with Dependencies Injected) ---
    async function makeApiRequest(fetch, windowGlobalData, rpcid, requestData, sourcePath) {
      assertType(rpcid, 'string');
      requestData = [[[rpcid, JSON.stringify(requestData), null, 'generic']]];
      const requestDataString = `f.req=${encodeURIComponent(JSON.stringify(requestData))}&at=${encodeURIComponent(windowGlobalData.at)}&`;
      const params = {
        rpcids: rpcid, 'source-path': sourcePath, 'f.sid': windowGlobalData['f.sid'], bl: windowGlobalData.bl, pageId: 'none', rt: 'c',
      };
      if (windowGlobalData.rapt) params.rapt = windowGlobalData.rapt;
      const paramsString = Object.keys(params).map((key) => `${key}=${encodeURIComponent(params[key])}`).join('&');
      const url = `https://photos.google.com${windowGlobalData.path}data/batchexecute?${paramsString}`;

      const response = await fetch(url, {
        headers: { 'content-type': 'application/x-www-form-urlencoded;charset=UTF-8' },
        body: requestDataString, method: 'POST', credentials: 'include',
      });

      const responseBody = await response.text();
      const jsonLines = responseBody.split('\n').filter((line) => line.includes('wrb.fr'));
      let parsedData = JSON.parse(jsonLines[0]);
      return JSON.parse(parsedData[0][2]);
    }

    async function getAlbums(fetch, windowGlobalData, sourcePath, pageId = null, pageSize = 100) {
      const rpcid = 'Z5xsfc';
      const requestData = [pageId, null, null, null, 1, null, null, pageSize, [2], 5];
      try {
        const response = await makeApiRequest(fetch, windowGlobalData, rpcid, requestData, sourcePath);
        const parsed = parser(response, rpcid);
        if (parsed && parsed.items) {
          return { success: true, data: parsed.items };
        }
        return { success: false, error: 'Failed to parse album data.', data: response };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }

    async function getAlbumPage(fetch, windowGlobalData, sourcePath, albumMediaKey, pageId = null) {
      const rpcid = 'snAcKc';
      const requestData = [albumMediaKey, pageId, null, null];
      try {
        const response = await makeApiRequest(fetch, windowGlobalData, rpcid, requestData, sourcePath);
        const parsed = parser(response, rpcid);
        if (parsed) {
          return { success: true, data: parsed };
        }
        return { success: false, error: 'Failed to parse album page data.', data: response };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }

    async function getItemInfo(fetch, windowGlobalData, sourcePath, mediaKey) {
      const rpcid = 'VrseUb';
      const requestData = [mediaKey, null, null, null, null];
      try {
        const response = await makeApiRequest(fetch, windowGlobalData, rpcid, requestData, sourcePath);
        const parsed = parser(response, rpcid);
        if (parsed) {
          return { success: true, data: parsed };
        }
        return { success: false, error: 'Failed to parse item info.', data: response };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }

    async function addItemsToSharedAlbum(fetch, windowGlobalData, sourcePath, mediaKeyArray, albumMediaKey) {
      const rpcid = 'laUYf';
      const requestData = [albumMediaKey, [2, null, mediaKeyArray.map((id) => [[id]]), null, null, null, [1]]];
      try {
        const response = await makeApiRequest(fetch, windowGlobalData, rpcid, requestData, sourcePath);
        // A null response from this RPCID indicates success.
        if (response === null) {
          return { success: true, data: response };
        }
        return { success: false, error: 'API returned an unexpected response.', data: response };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }

    async function addItemsToNonSharedAlbum(fetch, windowGlobalData, sourcePath, mediaKeyArray, albumMediaKey) {
      const rpcid = 'E1Cajb';
      const requestData = [mediaKeyArray, albumMediaKey];
      try {
        const response = await makeApiRequest(fetch, windowGlobalData, rpcid, requestData, sourcePath);
        if (Array.isArray(response) && response.length > 0) {
          return { success: true, data: response };
        }
        return { success: false, error: 'API returned an unexpected response for non-shared album.', data: response };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }

    async function startProcessing(fetch, windowGlobalData, sourcePath, log, getUiState) {
        const { selectedAlbums, filter, destinationAlbum } = getUiState();

        if (selectedAlbums.length === 0) { log('No source albums selected.'); return; }
        if (!destinationAlbum) { log('No destination album selected.'); return; }

        log('Starting processing...');
        const allMediaItems = [];

        for (const albumId of selectedAlbums) {
            log(`Fetching media items from album ${albumId}...`);
            let nextPageId = null;
            do {
                const pageResult = await getAlbumPage(fetch, windowGlobalData, sourcePath, albumId, nextPageId);
                if (!pageResult.success) {
                    log(`Error fetching page from album ${albumId}: ${pageResult.error}. Response: ${JSON.stringify(pageResult.data)}`);
                    break;
                }
                allMediaItems.push(...pageResult.data.items);
                nextPageId = pageResult.data.nextPageId;
            } while (nextPageId);
            log(`Found ${allMediaItems.length} total items in album.`);
        }
        log(`Found ${allMediaItems.length} total items across all selected albums.`);

        const matchedItems = [];
        const batchSize = 20;
        for (let i = 0; i < allMediaItems.length; i += batchSize) {
            const batch = allMediaItems.slice(i, i + batchSize);
            const promises = batch.map(item => getItemInfo(fetch, windowGlobalData, sourcePath, item.mediaKey));
            const itemInfoResults = await Promise.all(promises);

            for (const result of itemInfoResults) {
                if (!result.success) {
                    log(`Error getting item info: ${result.error}. Response: ${JSON.stringify(result.data)}`);
                    continue;
                }
                const info = result.data;
                let match = false;
                if (filter === 'saved' && info.savedToYourPhotos) match = true;
                if (filter === 'not-saved' && !info.savedToYourPhotos) match = true;
                if (filter === 'any') match = true;
                if (match) matchedItems.push(info.mediaKey);
            }
        }
        log(`Found ${matchedItems.length} matching items.`);

        if (matchedItems.length > 0) {
            log(`Adding ${matchedItems.length} items to destination album...`);

            let addResult;
            if (destinationAlbum.isShared) {
                log('Destination is a shared album.');
                addResult = await addItemsToSharedAlbum(fetch, windowGlobalData, sourcePath, matchedItems, destinationAlbum.mediaKey);
            } else {
                log('Destination is a non-shared album.');
                addResult = await addItemsToNonSharedAlbum(fetch, windowGlobalData, sourcePath, matchedItems, destinationAlbum.mediaKey);
            }

            if (addResult.success) {
                log('Successfully added items to the album.');
            } else {
                log(`Error: Failed to add items to the album. ${addResult.error}. Response: ${JSON.stringify(addResult.data)}`);
            }
        }
    }

    // --- UI Layer (Remains coupled to the DOM and Tampermonkey) ---
    function createUI() {
      // Create elements programmatically to comply with TrustedHTML
      const overlay = document.createElement('div');
      overlay.className = 'gpuf-modal-overlay';

      const modal = document.createElement('div');
      modal.className = 'gpuf-modal';

      const header = document.createElement('div');
      header.className = 'gpuf-modal-header';

      const title = document.createElement('h2');
      title.textContent = 'Google Photos Unsaved Finder';

      const closeButton = document.createElement('button');
      closeButton.className = 'gpuf-close-button';
      closeButton.textContent = '\u00D7';

      header.appendChild(title);
      header.appendChild(closeButton);

      const content = document.createElement('div');
      content.className = 'gpuf-modal-content';

      const albumList = document.createElement('div');
      albumList.className = 'gpuf-album-list';

      const filterControls = document.createElement('div');
      filterControls.className = 'gpuf-filter-controls';

      const filters = [
        { value: 'any', text: ' Any' },
        { value: 'saved', text: ' Saved' },
        { value: 'not-saved', text: ' Not Saved', checked: true }
      ];

      filters.forEach(filter => {
        const label = document.createElement('label');
        const input = document.createElement('input');
        input.type = 'radio';
        input.name = 'filter';
        input.value = filter.value;
        if (filter.checked) input.checked = true;
        label.appendChild(input);
        label.appendChild(document.createTextNode(filter.text));
        filterControls.appendChild(label);
      });

      const destinationControls = document.createElement('div');
      destinationControls.className = 'gpuf-destination-controls';

      const destinationLabel = document.createElement('label');
      destinationLabel.htmlFor = 'destination-album';
      destinationLabel.textContent = 'Destination Album';

      const destinationSelect = document.createElement('select');
      destinationSelect.id = 'destination-album';

      destinationControls.appendChild(destinationLabel);
      destinationControls.appendChild(destinationSelect);

      const startButton = document.createElement('button');
      startButton.className = 'gpuf-start-button';
      startButton.textContent = 'Start';

      const logViewer = document.createElement('div');
      logViewer.className = 'gpuf-log-viewer';

      content.appendChild(albumList);
      content.appendChild(filterControls);
      content.appendChild(destinationControls);
      content.appendChild(startButton);
      content.appendChild(logViewer);

      modal.appendChild(header);
      modal.appendChild(content);
      overlay.appendChild(modal);

      document.body.appendChild(overlay);


      // In a real userscript, GM_addStyle would be used. For testing, this is a no-op.
      if (typeof GM_addStyle === 'function') {
        GM_addStyle(`
          .gpuf-modal-overlay {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.7); z-index: 1000;
          }
          .gpuf-modal {
            background: #282828; color: #e0e0e0; margin: 5% auto; padding: 20px;
            border-radius: 8px; max-width: 600px; max-height: 80vh; overflow-y: auto;
            border: 1px solid #444;
          }
          .gpuf-modal-header {
            display: flex; justify-content: space-between; align-items: center;
            border-bottom: 1px solid #444; padding-bottom: 10px;
          }
          .gpuf-modal-header h2 { color: #e0e0e0; }
          .gpuf-album-list {
            max-height: 200px; overflow-y: scroll; border: 1px solid #444;
            padding: 10px; margin: 10px 0; background: #333;
          }
          .gpuf-album-list label { display: block; margin-bottom: 5px; }
          .gpuf-log-viewer {
            margin-top: 10px; padding: 10px; border: 1px solid #444;
            height: 120px; /* Approx 5 lines */
            overflow-y: scroll; font-family: monospace; font-size: 12px;
            background: #333; color: #e0e0e0;
          }
          .gpuf-filter-controls, .gpuf-destination-controls { margin: 15px 0; }
          .gpuf-close-button {
            background: none; border: none; font-size: 24px; color: #e0e0e0; cursor: pointer;
          }
          .gpuf-start-button {
            background-color: #4CAF50; color: white; padding: 10px 15px;
            border: none; border-radius: 4px; cursor: pointer;
          }
          .gpuf-start-button:hover { background-color: #45a049; }
        `);
      }

      closeButton.addEventListener('click', () => overlay.remove());

      const log = (message) => {
        const logEntry = document.createElement('div');
        logEntry.textContent = message;
        logViewer.appendChild(logEntry);
        logViewer.scrollTop = logViewer.scrollHeight;
      };

      const albumsCache = []; // Store full album objects

      const getUiState = () => {
        const selectedDestinationOption = destinationSelect.options[destinationSelect.selectedIndex];
        const destinationAlbum = selectedDestinationOption ? albumsCache.find(a => a.mediaKey === selectedDestinationOption.value) : null;

        return {
            selectedAlbums: Array.from(albumList.querySelectorAll('input:checked')).map(input => input.value),
            filter: filterControls.querySelector('input[name="filter"]:checked').value,
            destinationAlbum: destinationAlbum,
        };
      };

      const sourcePath = window.location.pathname;
      // Here, we inject the real browser 'fetch' and window data into the core logic.
      getAlbums(fetch, getWindowGlobalData(), sourcePath).then(result => {
        if (result.success) {
          albumsCache.push(...result.data); // Cache the full album objects
          result.data.forEach(album => {
            const label = document.createElement('label');
            const input = document.createElement('input');
          input.type = 'checkbox';
          input.value = album.mediaKey;
          label.appendChild(input);
          label.appendChild(document.createTextNode(` ${album.title}`));
          albumList.appendChild(label);


          const optionEl = document.createElement('option');
          optionEl.value = album.mediaKey;
          optionEl.textContent = album.title;
          destinationSelect.appendChild(optionEl);
        });
        }
      });

      startButton.addEventListener('click', () => startProcessing(fetch, getWindowGlobalData(), sourcePath, log, getUiState));
    }

    function start() {
      createUI();
    }

    // Expose functions for testing under Node.js
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            getAlbums,
            getAlbumPage,
            getItemInfo,
            addItemsToSharedAlbum,
            addItemsToNonSharedAlbum,
            startProcessing,
            createUI, // We can still test parts of the UI setup
            start,
            // also export parsers for unit testing
            albumParse,
            albumsPage,
            albumItemParse,
            albumItemsPage,
            itemInfoParse
        };
    }

    // Register the menu command for the browser extension
    if (typeof GM_registerMenuCommand === 'function') {
      GM_registerMenuCommand('Open Google Photos Unsaved Finder', start);
    }
})();
