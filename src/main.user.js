// ==UserScript==
// @name         Google Photos Unsaved Finder
// @namespace    http://tampermonkey.net/
// @version      2025.09.02-2148
// @description  Detects if the Google-Photos-Toolkit is available and displays a message.
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
    if (typeof GM_addStyle === 'undefined') { global.GM_addStyle = () => {}; }
    if (typeof GM_registerMenuCommand === 'undefined') { global.GM_registerMenuCommand = () => {}; }
    if (typeof GM_info === 'undefined') { global.GM_info = { script: { version: 'test-version' } }; }
    if (typeof unsafeWindow === 'undefined') { global.unsafeWindow = {}; }
    console.log(`GPUF: Script version ${GM_info.script.version}`);
    function isGptkApiAvailable() {
        return typeof unsafeWindow.gptkApi !== 'undefined' && unsafeWindow.gptkApi !== null;
    }
    function createUI() {
        const container = document.createElement('div');
        const content = document.createElement('div');
        if (isGptkApiAvailable()) {
            content.textContent = 'GPTK API is available!';
        } else {
            content.textContent = 'GPTK API is not available!';
        }
        container.appendChild(content);
        const closeButton = document.createElement('button');
        closeButton.textContent = 'Close';
        container.appendChild(closeButton);
        return container;
    }
    function start() {
        GM_addStyle('.gpf-window { position: fixed; top: 20%; left: 50%; transform: translateX(-50%); background-color: white; border: 1px solid #ccc; padding: 2rem; z-index: 99999; text-align: center; } .gpf-window div { font-size: 1.5rem; margin-bottom: 1rem; }');
        const ui = createUI();
        ui.classList.add('gpf-window');
        const closeButton = ui.querySelector('button');
        closeButton.addEventListener('click', () => { ui.remove(); });
        document.body.appendChild(ui);
    }
    GM_registerMenuCommand('Start Google Photos Unsaved Finder', start);
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { createUI, isGptkApiAvailable };
    }

    // Expose functions for Jest testing environment
    if (typeof process !== 'undefined' && process.env.JEST_WORKER_ID) {
        global.testingExports = {
            createUI,
            isGptkApiAvailable,
            start
        };
    }
})();
