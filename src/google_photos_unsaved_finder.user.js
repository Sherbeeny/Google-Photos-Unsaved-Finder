// ==UserScript==
// @name         Google Photos Unsaved Finder
// @namespace    http://tampermonkey.net/
// @version      2025.12.18-1531
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
    async function makeApiRequest(fetch, windowGlobalData, rpcid, requestData) {
      assertType(rpcid, 'string');
      requestData = [[[rpcid, JSON.stringify(requestData), null, 'generic']]];
      const requestDataString = `f.req=${encodeURIComponent(JSON.stringify(requestData))}&at=${encodeURIComponent(windowGlobalData.at)}&`;
      const params = {
        rpcids: rpcid, 'source-path': '/', 'f.sid': windowGlobalData['f.sid'], bl: windowGlobalData.bl, pageId: 'none', rt: 'c',
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

    async function getAlbums(fetch, windowGlobalData, pageId = null, pageSize = 100) {
      const rpcid = 'Z5xsfc';
      const requestData = [pageId, null, null, null, 1, null, null, pageSize, [2], 5];
      try {
        const response = await makeApiRequest(fetch, windowGlobalData, rpcid, requestData);
        const parsed = parser(response, rpcid);
        return parsed ? parsed.items : [];
      } catch (error) {
        console.error('Error in getAlbums:', error);
        throw error;
      }
    }

    async function getAlbumPage(fetch, windowGlobalData, albumMediaKey, pageId = null) {
      const rpcid = 'snAcKc';
      const requestData = [albumMediaKey, pageId, null, null];
      try {
        const response = await makeApiRequest(fetch, windowGlobalData, rpcid, requestData);
        return parser(response, rpcid);
      } catch (error) {
        console.error('Error in getAlbumPage:', error);
        throw error;
      }
    }

    async function getItemInfo(fetch, windowGlobalData, mediaKey) {
      const rpcid = 'VrseUb';
      const requestData = [mediaKey, null, null, null, null];
      try {
        const response = await makeApiRequest(fetch, windowGlobalData, rpcid, requestData);
        return parser(response, rpcid);
      } catch (error) {
        console.error('Error in getItemInfo:', error);
        throw error;
      }
    }

    async function addItemsToAlbum(fetch, windowGlobalData, mediaKeyArray, albumMediaKey) {
      const rpcid = 'laUYf';
      const requestData = [albumMediaKey, [2, null, mediaKeyArray.map((id) => [[id]]), null, null, null, [1]]];
      try {
        const response = await makeApiRequest(fetch, windowGlobalData, rpcid, requestData);
        // A successful response should be a non-empty array. A silent failure might return null or an empty array.
        return Array.isArray(response) && response.length > 0;
      } catch (error) {
        console.error('Error in addItemsToAlbum:', error);
        return false; // Treat network errors as a failure.
      }
    }

    async function startProcessing(fetch, windowGlobalData, log, getUiState) {
        const { selectedAlbums, filter, destination } = getUiState();

        if (selectedAlbums.length === 0) { log('No source albums selected.'); return; }
        if (!destination) { log('No destination album selected.'); return; }

        log('Starting processing...');
        let totalItems = 0;
        const allMediaItems = [];

        for (const albumId of selectedAlbums) {
          log(`Fetching media items from album ${albumId}...`);
          let page = await getAlbumPage(fetch, windowGlobalData, albumId);
          while (page && page.items) {
            totalItems += page.items.length;
            allMediaItems.push(...page.items);
            if (page.nextPageId) {
              page = await getAlbumPage(fetch, windowGlobalData, albumId, page.nextPageId);
            } else {
              break;
            }
          }
          log(`Found ${totalItems} items in album.`);
        }
        log(`Found ${totalItems} total items across all selected albums.`);

        const matchedItems = [];
        const batchSize = 20;
        for (let i = 0; i < allMediaItems.length; i += batchSize) {
            const batch = allMediaItems.slice(i, i + batchSize);
            const promises = batch.map(item => getItemInfo(fetch, windowGlobalData, item.mediaKey));
            const itemInfos = await Promise.all(promises);

            for (const info of itemInfos) {
                if (!info) continue;
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
          const success = await addItemsToAlbum(fetch, windowGlobalData, matchedItems, destination);
          if (success) {
            log('Successfully added items to the album.');
          } else {
            log('Error: Failed to add items to the album. The API returned an unexpected response.');
          }
        }
    }

    // --- UI Layer (Remains coupled to the DOM and Tampermonkey) ---
    function createUI() {
      const container = document.createElement('div');
      container.innerHTML = `
        <div class="gpuf-modal-overlay">
          <div class="gpuf-modal">
            <div class="gpuf-modal-header"><h2>Google Photos Unsaved Finder</h2><button class="gpuf-close-button">&times;</button></div>
            <div class="gpuf-modal-content">
              <div class="gpuf-album-list"></div>
              <div class="gpuf-filter-controls">
                <label><input type="radio" name="filter" value="any" /> Any</label>
                <label><input type="radio" name="filter" value="saved" /> Saved</label>
                <label><input type="radio" name="filter" value="not-saved" checked /> Not Saved</label>
              </div>
              <div class="gpuf-destination-controls"><label for="destination-album">Destination Album</label><select id="destination-album"></select></div>
              <button class="gpuf-start-button">Start</button>
              <div class="gpuf-log-viewer"></div>
            </div>
          </div>
        </div>`;
      document.body.appendChild(container);

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

      container.querySelector('.gpuf-close-button').addEventListener('click', () => container.remove());

      const albumList = container.querySelector('.gpuf-album-list');
      const destinationList = container.querySelector('#destination-album');
      const logViewer = container.querySelector('.gpuf-log-viewer');
      const log = (message) => {
        const logEntry = document.createElement('div');
        logEntry.textContent = message;
        logViewer.appendChild(logEntry);
        logViewer.scrollTop = logViewer.scrollHeight;
      };

      const getUiState = () => ({
        selectedAlbums: Array.from(albumList.querySelectorAll('input:checked')).map(input => input.value),
        filter: document.querySelector('input[name="filter"]:checked').value,
        destination: destinationList.value,
      });

      // Here, we inject the real browser 'fetch' and window data into the core logic.
      getAlbums(fetch, getWindowGlobalData()).then(albums => {
        albums.forEach(album => {
          const albumEl = document.createElement('div');
          albumEl.innerHTML = `<label><input type="checkbox" value="${album.mediaKey}" /> ${album.title}</label>`;
          albumList.appendChild(albumEl);

          const optionEl = document.createElement('option');
          optionEl.value = album.mediaKey;
          optionEl.textContent = album.title;
          destinationList.appendChild(optionEl);
        });
      });

      container.querySelector('.gpuf-start-button').addEventListener('click', () => startProcessing(fetch, getWindowGlobalData(), log, getUiState));
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
            addItemsToAlbum,
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
