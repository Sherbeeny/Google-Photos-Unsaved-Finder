// ==UserScript==
// @name         Google Photos Unsaved Finder
// @namespace    http://tampermonkey.net/
// @version      2025.09.05-2249
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
    // Polyfills for testing environment
    if (typeof GM_addStyle === 'undefined') { global.GM_addStyle = () => {}; }
    if (typeof GM_registerMenuCommand === 'undefined') { global.GM_registerMenuCommand = () => {}; }
    if (typeof GM_info === 'undefined') { global.GM_info = { script: { version: 'test-version' } }; }
    if (typeof unsafeWindow === 'undefined') { global.unsafeWindow = {}; }
    if (typeof window.trustedTypes === 'undefined') { global.window.trustedTypes = { createPolicy: (name, rules) => rules }; }


    console.log(`GPUF: Script version ${GM_info.script.version}`);

    let _policy = null;
    function getPolicy() {
        if (_policy) return _policy;
        if (window.trustedTypes && window.trustedTypes.policies && window.trustedTypes.policies.has('default')) {
            _policy = window.trustedTypes.policies.get('default');
        } else {
            _policy = window.trustedTypes.createPolicy('default', {
                createHTML: (string) => string,
            });
        }
        return _policy;
    }

    function setSafeHTML(element, htmlString) {
        const policy = getPolicy();
        element.innerHTML = policy.createHTML(htmlString);
    }

    // Centralized logging function
    let logHistory = '';
    function log(message, level = 'info', ...args) {
        const logWindow = document.querySelector('.gpf-log-window');
        const timestamp = new Date().toLocaleTimeString();
        const logMessage = `${timestamp}: ${message}`;

        if (logWindow) {
            logHistory += logMessage + '<br>';
            setSafeHTML(logWindow, logHistory);
            logWindow.scrollTop = logWindow.scrollHeight; // Auto-scroll
        }

        if (level === 'error') {
            console.error(`GPUF: ${message}`, ...args);
        } else {
            console.log(`GPUF: ${message}`, ...args);
        }
    }

    function clearLog() {
        logHistory = '';
        const logWindow = document.querySelector('.gpf-log-window');
        if (logWindow) {
            setSafeHTML(logWindow, '');
        }
    }


    function isGptkApiAvailable() {
        return typeof unsafeWindow.gptkApi !== 'undefined' && unsafeWindow.gptkApi !== null;
    }

    async function startProcessing(ui) {
        const startButton = ui.querySelector('.gpf-start-button');
        const stopButton = ui.querySelector('.gpf-stop-button');
        const sourceSelect = ui.querySelector('.gpf-source-album-select');
        const filter = ui.querySelector('input[name="filter"]:checked').value;
        const batchSize = parseInt(ui.querySelector('.gpf-batch-size-input').value, 10);

        startButton.style.display = 'none';
        stopButton.style.display = 'inline-block';
        clearLog();

        const selectedAlbumId = sourceSelect.value;
        if (!selectedAlbumId) {
            log('Error: No source album selected.', 'error');
            return;
        }

        log('Fetching media items...');
        const mediaItems = await unsafeWindow.gptkApi.getAlbumMediaItems(selectedAlbumId);
        log(`Found ${mediaItems.length} total items.`);

        const matchedItems = [];
        const numBatches = Math.ceil(mediaItems.length / batchSize);

        for (let i = 0; i < numBatches; i++) {
            const batch = mediaItems.slice(i * batchSize, (i + 1) * batchSize);
            log(`Processing batch ${i + 1} of ${numBatches}...`);

            const promises = batch.map(item => unsafeWindow.gptkApi.getItemInfo(item.id));
            const itemInfos = await Promise.all(promises);

            itemInfos.forEach(itemInfo => {
                let match = false;
                if (filter === 'saved' && itemInfo.savedToYourPhotos) match = true;
                if (filter === 'not-saved' && !itemInfo.savedToYourPhotos) match = true;
                if (filter === 'any') match = true;

                if (match) {
                    matchedItems.push(itemInfo);
                }
            });
        }

        log(`Scan complete. Found ${matchedItems.length} matching items.`);

        startButton.style.display = 'inline-block';
        stopButton.style.display = 'none';

        return matchedItems;
    }

    async function loadAlbumData(sourceSelect, destSelect) {
        sourceSelect.disabled = true;
        destSelect.disabled = true;
        setSafeHTML(sourceSelect, '<option>Refreshing albums...</option>');
        setSafeHTML(destSelect, '<option>Refreshing albums...</option>');

        try {
            const response = await unsafeWindow.gptkApi.getAlbums();
            // Bug Fix: Use `response.items` instead of `response.albums`
            const albums = response && response.items ? response.items : [];

            setSafeHTML(sourceSelect, '');
            setSafeHTML(destSelect, '');

            if (albums.length === 0) {
                setSafeHTML(sourceSelect, '<option>No albums found</option>');
                setSafeHTML(destSelect, '<option>No albums found</option>');
                return;
            }

            const sourceSelectAll = document.createElement('option');
            sourceSelectAll.textContent = 'Select All';
            sourceSelectAll.value = 'all';
            sourceSelect.appendChild(sourceSelectAll);

            const destSelectOne = document.createElement('option');
            destSelectOne.textContent = '-- Select an album --';
            destSelectOne.value = '';
            destSelect.appendChild(destSelectOne);

            albums.forEach(album => {
                const option = document.createElement('option');
                // Bug Fix: Use `album.mediaKey` instead of `album.id`
                option.value = album.mediaKey;
                option.textContent = album.title;
                sourceSelect.appendChild(option.cloneNode(true));
                destSelect.appendChild(option);
            });

        } catch (error) {
            log('Error loading albums', 'error', error);
            setSafeHTML(sourceSelect, '<option>Error loading albums</option>');
            setSafeHTML(destSelect, '<option>Error loading albums</option>');
        } finally {
            sourceSelect.disabled = false;
            destSelect.disabled = false;
        }
    }

    function createUI() {
        const container = document.createElement('div');
        container.className = 'gpf-window';
        setSafeHTML(container, `
            <button class="gpf-close-x-button" style="position: absolute; top: 10px; right: 10px; border: none; background: transparent; font-size: 1.5rem; cursor: pointer; color: #5f6368;">X</button>
            <h2>Google Photos Unsaved Finder</h2>
            <div class="gpf-section-source-albums">
                <label>Source Album(s):</label>
                <select class="gpf-source-album-select" multiple></select>
            </div>
            <div class="gpf-section-filters">
                <label>Filter by:</label>
                <div class="gpf-radio-group">
                    <label><input type="radio" name="filter" value="any"> Any</label>
                    <label><input type="radio" name="filter" value="saved"> Saved</label>
                    <label><input type="radio" name="filter" value="not-saved" checked> Not Saved</label>
                </div>
            </div>
            <div class="gpf-section-batch-size">
                <label for="batch-size-input">Batch Size:</label>
                <input type="number" id="batch-size-input" class="gpf-batch-size-input" value="20" min="1" max="100">
            </div>
            <div class="gpf-section-destination">
                <label>Destination:</label>
                <select class="gpf-dest-album-select"></select>
            </div>
            <div>
                <button class="gpf-start-button">Start</button>
                <button class="gpf-stop-button" style="display: none;">Stop</button>
            </div>
            <div class="gpf-feedback-area">
                <div class="gpf-log-window"></div>
            </div>
        `);
        return container;
    }

    async function start() {
        GM_addStyle(`
            .gpf-window { position: fixed; top: 10%; left: 50%; transform: translateX(-50%); background-color: #fff; color: #202124; border: 1px solid #dadce0; border-radius: 8px; padding: 1rem 2rem; z-index: 99999; width: 500px; box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24); }
            .gpf-window h2 { margin-top: 0; text-align: center; color: #202124; }
            .gpf-window div { margin-bottom: 1rem; }
            .gpf-window label { display: block; margin-bottom: .5rem; font-weight: 500; color: #3c4043; }
            .gpf-window select, .gpf-window input { width: 100%; padding: 8px; border: 1px solid #dadce0; border-radius: 4px; }
            .gpf-radio-group { display: flex; gap: 1rem; }
            .gpf-radio-group label { font-weight: normal; }
            .gpf-log-window { height: 100px; overflow-y: scroll; border: 1px solid #dadce0; padding: 8px; text-align: left; font-size: 0.8rem; background: #f8f9fa; color: #3c4043; }
        `);
        const ui = createUI();
        const closeButton = ui.querySelector('.gpf-close-x-button');
        const startButton = ui.querySelector('.gpf-start-button');
        const sourceSelect = ui.querySelector('.gpf-source-album-select');
        const destSelect = ui.querySelector('.gpf-dest-album-select');

        closeButton.addEventListener('click', () => { ui.remove(); });
        startButton.addEventListener('click', () => startProcessing(ui));
        document.body.appendChild(ui);

        if (!isGptkApiAvailable()) {
            startButton.disabled = true;
            log('Error: Google Photos Toolkit (GPTK) not found.', 'error');
        } else {
            try {
                // Bug Fix: Await the async function to ensure the catch block works
                await loadAlbumData(sourceSelect, destSelect);
            } catch(e) {
                log('A critical error occurred during startup.', 'error', e);
            }
        }
    }

    GM_registerMenuCommand('Start Google Photos Unsaved Finder', start);

    // Expose functions for Jest testing environment
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            createUI,
            isGptkApiAvailable,
            start,
            loadAlbumData,
            startProcessing,
        };
    }
})();
