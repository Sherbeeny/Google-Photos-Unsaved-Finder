// ==UserScript==
// @name         Google Photos Unsaved Finder
// @namespace    http://tampermonkey.net/
// @version      2025.12.22-0448
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
        isShared: itemData?.[7]?.length > 0,
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
        const infoObject = itemData[0]?.[9];
        return {
            mediaKey: itemData[0]?.[0],
            savedToYourPhotos: infoObject && infoObject.hasOwnProperty('163238866'),
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
            if (!response) {
                 return { success: false, error: `API returned null or undefined response for item ${mediaKey}. rpcid: ${rpcid}`, data: response };
            }
            const parsed = parser(response, rpcid);
            if (parsed) {
                return { success: true, data: parsed };
            }
            return { success: false, error: 'Failed to parse item info.', data: response };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async function addItemsToSharedAlbum(fetch, windowGlobalData, sourcePath, mediaKeyArray, albumMediaKey, log) {
        const rpcid = 'laUYf';
        const requestData = [albumMediaKey, [2, null, mediaKeyArray.map((id) => [[id]]), null, null, null, [1]]];
        // The try/catch is removed here. The caller `startProcessing` will handle it.
        const response = await makeApiRequest(fetch, windowGlobalData, rpcid, requestData, sourcePath);
        return response; // Return the raw response
    }

    async function addItemsToNonSharedAlbum(fetch, windowGlobalData, sourcePath, mediaKeyArray, albumMediaKey, log) {
        const rpcid = 'E1Cajb';
        const requestData = [mediaKeyArray, albumMediaKey];
        // The try/catch is removed here. The caller `startProcessing` will handle it.
        const response = await makeApiRequest(fetch, windowGlobalData, rpcid, requestData, sourcePath);
        return response; // Return the raw response
    }

    async function startProcessing(fetch, windowGlobalData, sourcePath, log, getUiState) {
        const { selectedAlbums, filter, destinationAlbum } = getUiState();

        if (selectedAlbums.length === 0) { log('No source albums selected.'); return; }
        if (!destinationAlbum) { log('No destination album selected.'); return; }

        log('Starting processing...');
        const matchedItems = [];
        let totalItemsScanned = 0;

        for (const album of selectedAlbums) {
            log(`Fetching media items from album: ${album.title}...`);
            let nextPageId = null;
            let itemsInAlbum = 0;
            const albumMediaItems = [];

            do {
                const pageResult = await getAlbumPage(fetch, windowGlobalData, sourcePath, album.mediaKey, nextPageId);
                if (!pageResult.success) {
                    log(`Error fetching page from album ${album.title}: ${pageResult.error}. Response: ${JSON.stringify(pageResult.data)}`);
                    break;
                }
                albumMediaItems.push(...pageResult.data.items);
                itemsInAlbum += pageResult.data.items.length;
                nextPageId = pageResult.data.nextPageId;
            } while (nextPageId);

            log(`Found ${itemsInAlbum} items in album. Checking their status...`);
            totalItemsScanned += itemsInAlbum;

            const batchSize = 20; // Batching for getItemInfo calls
            for (let i = 0; i < albumMediaItems.length; i += batchSize) {
                const batch = albumMediaItems.slice(i, i + batchSize);
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
        }

        log(`Scanned ${totalItemsScanned} total items across all selected albums.`);
        log(`Found ${matchedItems.length} matching items.`);

        if (matchedItems.length > 0) {
            log(`Adding ${matchedItems.length} items to destination album...`);

            const addBatchSize = 50; // Batching for adding items to album
            for (let i = 0; i < matchedItems.length; i += addBatchSize) {
                const batch = matchedItems.slice(i, i + addBatchSize);
                const batchNumber = (i / addBatchSize) + 1;
                log(`Adding batch ${batchNumber} of ${batch.length} items...`);
                try {
                    let addResult;
                    if (destinationAlbum.isShared) {
                        addResult = await addItemsToSharedAlbum(fetch, windowGlobalData, sourcePath, batch, destinationAlbum.mediaKey, log);
                    } else {
                        addResult = await addItemsToNonSharedAlbum(fetch, windowGlobalData, sourcePath, batch, destinationAlbum.mediaKey, log);
                    }
                     // Log the raw response for diagnostics
                    log(`API Response for batch ${batchNumber}: ${JSON.stringify(addResult, null, 2)}`);
                } catch (error) {
                    log(`Error adding batch ${batchNumber}: ${error.message}`);
                }
            }
            log('Finished adding all batches.');
        }
    }

    // --- UI Layer (Remains coupled to the DOM and Tampermonkey) ---
    function createUI(doc = document) {
      // Create elements programmatically to comply with TrustedHTML
      const overlay = doc.createElement('div');
      overlay.className = 'gpuf-modal-overlay';

      const modal = doc.createElement('div');
      modal.className = 'gpuf-modal';

      const header = doc.createElement('div');
      header.className = 'gpuf-modal-header';

      const title = doc.createElement('h2');
      title.textContent = 'Google Photos Unsaved Finder';

      const closeButton = doc.createElement('button');
      closeButton.className = 'gpuf-close-button';
      closeButton.textContent = '\u00D7';

      header.appendChild(title);
      header.appendChild(closeButton);

      const content = doc.createElement('div');
      content.className = 'gpuf-modal-content';

      const albumsToSearchLabel = doc.createElement('div');
      albumsToSearchLabel.textContent = 'Albums to search';
      albumsToSearchLabel.style.marginBottom = '5px';

      const albumList = doc.createElement('div');
      albumList.className = 'gpuf-album-list';

      const filterControls = doc.createElement('div');
      filterControls.className = 'gpuf-filter-controls';

      const itemsToFindLabel = doc.createElement('span');
      itemsToFindLabel.textContent = 'Items to find: ';
      filterControls.appendChild(itemsToFindLabel);

      const filters = [
        { value: 'any', text: ' Any' },
        { value: 'saved', text: ' Saved' },
        { value: 'not-saved', text: ' Not Saved', checked: true }
      ];

      filters.forEach(filter => {
        const label = doc.createElement('label');
        label.style.marginRight = '10px';
        const input = doc.createElement('input');
        input.type = 'radio';
        input.name = 'filter';
        input.value = filter.value;
        if (filter.checked) input.checked = true;
        label.appendChild(input);
        label.appendChild(doc.createTextNode(filter.text));
        filterControls.appendChild(label);
      });

      const destinationControls = doc.createElement('div');
      destinationControls.className = 'gpuf-destination-controls';
      destinationControls.style.display = 'flex';
      destinationControls.style.alignItems = 'center';

      const destinationLabel = doc.createElement('label');
      destinationLabel.htmlFor = 'destination-album';
      destinationLabel.textContent = 'Add them to album';
      destinationLabel.style.marginRight = '5px';
      destinationLabel.style.flexShrink = '0';

      const destinationSelect = doc.createElement('select');
      destinationSelect.id = 'destination-album';
      destinationSelect.style.width = '100%';

      destinationControls.appendChild(destinationLabel);
      destinationControls.appendChild(destinationSelect);

      const startButton = doc.createElement('button');
      startButton.className = 'gpuf-start-button';
      startButton.textContent = 'Start';

      const logViewer = doc.createElement('div');
      logViewer.className = 'gpuf-log-viewer';

      content.appendChild(albumsToSearchLabel);
      content.appendChild(albumList);
      content.appendChild(filterControls);
      content.appendChild(destinationControls);
      content.appendChild(startButton);
      content.appendChild(logViewer);

      modal.appendChild(header);
      modal.appendChild(content);
      overlay.appendChild(modal);

      doc.body.appendChild(overlay);


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
            padding-bottom: 10px;
          }
          .gpuf-modal-header h2 { color: #e0e0e0; }
          .gpuf-album-list {
            max-height: 5.5em; overflow-y: scroll; border: 1px solid #444;
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
          #destination-album { text-align: left; }
          .gpuf-close-button {
            background: none; border: none; font-size: 24px; color: #e0e0e0; cursor: pointer;
          }
          .gpuf-start-button {
            background-color: #4CAF50; color: white; padding: 10px 15px;
            border: none; border-radius: 4px; cursor: pointer;
            width: 100%; box-sizing: border-box;
          }
          .gpuf-start-button:hover { background-color: #45a049; }
        `);
      }

      closeButton.addEventListener('click', () => overlay.remove());

      const log = (message) => {
        const logEntry = doc.createElement('div');
        logEntry.textContent = message;
        logViewer.appendChild(logEntry);
        logViewer.scrollTop = logViewer.scrollHeight;
      };

      // Log the script version on UI load
      if (typeof GM_info !== 'undefined' && GM_info.script) {
        log(`Version: ${GM_info.script.version}`);
      }

      const albumsCache = []; // Store full album objects

      const getUiState = () => {
        const selectedDestinationOption = destinationSelect.options[destinationSelect.selectedIndex];
        const destinationAlbum = selectedDestinationOption ? albumsCache.find(a => a.mediaKey === selectedDestinationOption.value) : null;
        const selectedAlbumKeys = Array.from(albumList.querySelectorAll('input:checked')).map(input => input.value);

        return {
            selectedAlbums: albumsCache.filter(a => selectedAlbumKeys.includes(a.mediaKey)),
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
            const label = doc.createElement('label');
            const input = doc.createElement('input');
          input.type = 'checkbox';
          input.value = album.mediaKey;
          label.appendChild(input);
          label.appendChild(doc.createTextNode(` ${album.title}`));
          albumList.appendChild(label);


          const optionEl = doc.createElement('option');
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
