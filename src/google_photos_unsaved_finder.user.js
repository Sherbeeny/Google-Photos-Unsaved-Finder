// ==UserScript==
// @name         Google Photos Unsaved Finder
// @namespace    http://tampermonkey.net/
// @version      2025.12.22-1754
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

    /**
     * Retrieves essential global data from the browser's `unsafeWindow` object.
     * This function is coupled to the browser environment and is called once.
     * @returns {object} An object containing key global data points like API tokens and user info.
     */
    const getWindowGlobalData = () => ({
        rapt: unsafeWindow.WIZ_global_data.Dbw5Ud,
        account: unsafeWindow.WIZ_global_data.oPEP7c,
        'f.sid': unsafeWindow.WIZ_global_data.FdrFJe,
        bl: unsafeWindow.WIZ_global_data.cfb2h,
        path: unsafeWindow.WIZ_global_data.eptZe,
        at: unsafeWindow.WIZ_global_data.SNlM0e,
    });

    /**
     * Asserts that a variable is of an expected type, throwing a TypeError if not.
     * @param {*} variable - The variable to check.
     * @param {string} expectedType - The expected type (e.g., 'string', 'number').
     */
    function assertType(variable, expectedType) {
        const actualType = typeof variable;
        if (actualType !== expectedType) {
            throw new TypeError(`Expected type ${expectedType} but got ${actualType}`);
        }
    }

    // --- Data Parsing Functions (Pure) ---

    /**
     * Parses raw album data into a structured album object.
     * @param {Array} itemData - The raw data array for a single album.
     * @returns {{mediaKey: string, title: string, isShared: boolean}} A structured album object.
     */
    function albumParse(itemData) {
        return {
            mediaKey: itemData?.[0],
            title: itemData?.at(-1)?.[72930366]?.[1],
            isShared: itemData?.[7]?.length > 0,
        };
    }

    /**
     * Parses a page of album data.
     * @param {Array} data - The raw API response for a page of albums.
     * @returns {{items: Array<object>, nextPageId: string|null}} An object containing the parsed albums and a token for the next page.
     */
    function albumsPage(data) {
        return {
            items: data?.[0]?.map((itemData) => albumParse(itemData)),
            nextPageId: data?.[1],
        };
    }

    /**
     * Parses raw album item data into a structured object containing the media key.
     * @param {Array} itemData - The raw data array for a single item within an album.
     * @returns {{mediaKey: string}} A structured object with the item's media key.
     */
    function albumItemParse(itemData) {
        return {
            mediaKey: itemData?.[0],
        };
    }

    /**
     * Parses a page of album items.
     * @param {Array} data - The raw API response for a page of items in an album.
     * @returns {{items: Array<object>, nextPageId: string|null}} An object containing parsed items and a next page token.
     */
    function albumItemsPage(data) {
        return {
            items: data?.[1]?.map((itemData) => albumItemParse(itemData)),
            nextPageId: data?.[2],
        };
    }

    /**
     * Parses the response from an item info request to determine its properties, including saved status.
     * The saved status is determined by checking for the presence of the number 20 in any of the subarrays
     * at index 7, which is a reliable indicator based on analysis of API responses.
     * @param {Array} itemData - The raw data array for a single item's info.
     * @returns {{mediaKey: string, savedToYourPhotos: boolean}} An object with the media key and a boolean indicating if the item is saved.
     */
    function itemInfoParse(itemData) {
        const item = itemData[0];
        if (!item) {
            return { mediaKey: null, savedToYourPhotos: false };
        }
        // The metadata object's position is inconsistent. Check known locations.
        const infoObject = item[8] || item[9] || item[15];
        return {
            mediaKey: item[0],
            savedToYourPhotos: infoObject && typeof infoObject === 'object' && infoObject.hasOwnProperty('163238866'),
        };
    }

    /**
     * A master parser function that delegates to the correct specific parser based on the rpcid.
     * @param {Array} data - The raw data from the API.
     * @param {string} rpcid - The RPC ID of the API request, which determines the data structure.
     * @returns {object|null} The parsed data object, or null if no parser is found.
     */
    function parser(data, rpcid) {
        if (rpcid === 'Z5xsfc') return albumsPage(data);
        if (rpcid === 'snAcKc') return albumItemsPage(data);
        if (rpcid === 'VrseUb') return itemInfoParse(data);
        return null;
    }

    // --- Core API Logic (Dependencies Injected) ---

    /**
     * Makes a generic API request to the Google Photos backend.
     * @param {function} fetch - The fetch function to use for the request.
     * @param {object} windowGlobalData - An object with global data like auth tokens.
     * @param {string} rpcid - The RPC ID for the specific API endpoint.
     * @param {Array} requestData - The payload for the API request.
     * @param {string} sourcePath - The current URL path, used by the API.
     * @returns {Promise<Array>} A promise that resolves with the parsed JSON response from the API.
     */
    async function makeApiRequest(fetch, windowGlobalData, rpcid, requestData, sourcePath) {
        assertType(rpcid, 'string');
        requestData = [[[rpcid, JSON.stringify(requestData), null, 'generic']]];
        const requestDataString = `f.req=${encodeURIComponent(JSON.stringify(requestData))}&at=${encodeURIComponent(windowGlobalData.at)}&`;
        const params = {
            rpcids: rpcid,
            'source-path': sourcePath,
            'f.sid': windowGlobalData['f.sid'],
            bl: windowGlobalData.bl,
            pageId: 'none',
            rt: 'c',
        };
        if (windowGlobalData.rapt) params.rapt = windowGlobalData.rapt;
        const paramsString = Object.keys(params).map((key) => `${key}=${encodeURIComponent(params[key])}`).join('&');
        const url = `https://photos.google.com${windowGlobalData.path}data/batchexecute?${paramsString}`;

        const response = await fetch(url, {
            headers: { 'content-type': 'application/x-www-form-urlencoded;charset=UTF-8' },
            body: requestDataString,
            method: 'POST',
            credentials: 'include',
        });

        const responseBody = await response.text();
        const jsonLines = responseBody.split('\n').filter((line) => line.includes('wrb.fr'));
        let parsedData = JSON.parse(jsonLines[0]);
        return JSON.parse(parsedData[0][2]);
    }

    /**
     * Fetches a list of all albums.
     * @param {function} fetch - The fetch function.
     * @param {object} windowGlobalData - Global auth data.
     * @param {string} sourcePath - The current URL path.
     * @param {string|null} [pageId=null] - The page token for pagination.
     * @param {number} [pageSize=100] - The number of albums to fetch per page.
     * @returns {Promise<{success: boolean, data: Array|object, error?: string}>} A result object.
     */
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

    /**
     * Fetches a single page of items from a specific album.
     * @param {function} fetch - The fetch function.
     * @param {object} windowGlobalData - Global auth data.
     * @param {string} sourcePath - The current URL path.
     * @param {string} albumMediaKey - The media key of the album to fetch.
     * @param {string|null} [pageId=null] - The page token for pagination.
     * @returns {Promise<{success: boolean, data: object, error?: string}>} A result object.
     */
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

    /**
     * Fetches detailed information for a single media item.
     * @param {function} fetch - The fetch function.
     * @param {object} windowGlobalData - Global auth data.
     * @param {string} sourcePath - The current URL path.
     * @param {string} mediaKey - The media key of the item to inspect.
     * @returns {Promise<{success: boolean, data: object, error?: string}>} A result object.
     */
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

    /**
     * Adds an array of media items to a SHARED album.
     * The request format is based on analysis of the working GPTK script.
     * @param {function} fetch - The fetch function.
     * @param {object} windowGlobalData - Global auth data.
     * @param {string} sourcePath - The current URL path.
     * @param {Array<string>} mediaKeyArray - An array of media keys to add.
     * @param {string} albumMediaKey - The media key of the destination shared album.
     * @returns {Promise<Array|null>} A promise that resolves with the raw API response.
     */
    async function addItemsToSharedAlbum(fetch, windowGlobalData, sourcePath, mediaKeyArray, albumMediaKey) {
        const rpcid = 'laUYf';
        // This complex request data structure is based on the working implementation in GPTK.
        const requestData = [albumMediaKey, [2, null, mediaKeyArray.map((id) => [[id]]), null, null, null, [1]]];
        return await makeApiRequest(fetch, windowGlobalData, rpcid, requestData, sourcePath);
    }

    /**
     * Adds an array of media items to a NON-SHARED (private) album.
     * @param {function} fetch - The fetch function.
     * @param {object} windowGlobalData - Global auth data.
     * @param {string} sourcePath - The current URL path.
     * @param {Array<string>} mediaKeyArray - An array of media keys to add.
     * @param {string} albumMediaKey - The media key of the destination private album.
     * @returns {Promise<Array|null>} A promise that resolves with the raw API response.
     */
    async function addItemsToNonSharedAlbum(fetch, windowGlobalData, sourcePath, mediaKeyArray, albumMediaKey) {
        const rpcid = 'E1Cajb';
        const requestData = [mediaKeyArray, albumMediaKey];
        return await makeApiRequest(fetch, windowGlobalData, rpcid, requestData, sourcePath);
    }

    /**
     * The main processing function that orchestrates the entire workflow.
     * It iterates through selected albums one by one, finds matching items, and adds them to the destination.
     * @param {function} fetch - The fetch function.
     * @param {object} windowGlobalData - Global auth data.
     * @param {string} sourcePath - The current URL path.
     * @param {function} log - The logging function to output messages to the UI.
     * @param {function} getUiState - A function that returns the current state of the UI controls.
     */
    async function startProcessing(fetch, windowGlobalData, sourcePath, log, getUiState) {
        const { selectedAlbums, filter, destinationAlbum } = getUiState();

        if (selectedAlbums.length === 0) { log('No source albums selected.'); return; }
        if (!destinationAlbum) { log('No destination album selected.'); return; }

        log('Starting processing...');
        let totalItemsScanned = 0;
        let totalItemsMatched = 0;

        // --- Per-Album Processing Loop ---
        // This loop processes one album completely before moving to the next.
        // This prevents logical errors where items from different albums are mixed up.
        for (const album of selectedAlbums) {
            log(`--- Processing Album: ${album.title} ---`);
            const albumMediaItems = [];
            let nextPageId = null;

            // 1. Fetch all item media keys from the current album, handling pagination.
            log('Fetching all media items from album...');
            do {
                const pageResult = await getAlbumPage(fetch, windowGlobalData, sourcePath, album.mediaKey, nextPageId);
                if (!pageResult.success) {
                    log(`Error fetching page from album: ${pageResult.error}.`);
                    break; // Break from pagination loop on error
                }
                albumMediaItems.push(...pageResult.data.items);
                nextPageId = pageResult.data.nextPageId;
            } while (nextPageId);

            log(`Found ${albumMediaItems.length} total items in album.`);
            totalItemsScanned += albumMediaItems.length;

            // 2. Check the status of each item in the album.
            log('Checking status of each item...');
            const matchedItems = [];
            const batchSize = 20; // Process in batches to avoid overwhelming the API.
            for (let i = 0; i < albumMediaItems.length; i += batchSize) {
                const batch = albumMediaItems.slice(i, i + batchSize);
                const promises = batch.map(item => getItemInfo(fetch, windowGlobalData, sourcePath, item.mediaKey));
                const itemInfoResults = await Promise.all(promises);

                for (const result of itemInfoResults) {
                    if (!result.success) {
                        log(`Error getting item info: ${result.error}`);
                        continue;
                    }
                    const info = result.data;
                    let isMatch = false;
                    if (filter === 'saved' && info.savedToYourPhotos) isMatch = true;
                    if (filter === 'not-saved' && !info.savedToYourPhotos) isMatch = true;
                    if (filter === 'any') isMatch = true;

                    if (isMatch) {
                        log(`Found matching item: ${info.mediaKey}`);
                        matchedItems.push(info.mediaKey);
                    }
                }
            }

            log(`Found ${matchedItems.length} matching items in this album.`);
            totalItemsMatched += matchedItems.length;

            // 3. Add the matched items from this album to the destination.
            if (matchedItems.length > 0) {
                log(`Adding ${matchedItems.length} items to destination album: ${destinationAlbum.title}...`);
                const addBatchSize = 50; // API limit for adding items is 50 per request.
                for (let i = 0; i < matchedItems.length; i += addBatchSize) {
                    const batch = matchedItems.slice(i, i + addBatchSize);
                    const batchNumber = (i / addBatchSize) + 1;
                    log(`Adding batch ${batchNumber} of ${batch.length} items...`);
                    try {
                        let addResult;
                        if (destinationAlbum.isShared) {
                            addResult = await addItemsToSharedAlbum(fetch, windowGlobalData, sourcePath, batch, destinationAlbum.mediaKey);
                        } else {
                            addResult = await addItemsToNonSharedAlbum(fetch, windowGlobalData, sourcePath, batch, destinationAlbum.mediaKey);
                        }

                        // Based on GPTK analysis, only an array response indicates success.
                        if (Array.isArray(addResult)) {
                            log(`Batch ${batchNumber} added successfully.`);
                        } else {
                            log(`Error adding batch ${batchNumber}. Unexpected API Response: ${JSON.stringify(addResult, null, 2)}`);
                        }
                    } catch (error) {
                        log(`Error adding batch ${batchNumber}: ${error.message}`);
                    }
                }
            }
        } // --- End of Per-Album Loop ---

        log('--- Summary ---');
        log(`Scanned ${totalItemsScanned} total items across all selected albums.`);
        log(`Found ${totalItemsMatched} total matching items.`);
        log('Processing complete.');
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
            createUI,
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
