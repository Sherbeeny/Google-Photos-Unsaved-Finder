// ==UserScript==
// @name         Google Photos Unsaved Finder
// @namespace    http://tampermonkey.net/
// @version      2025.09.02-0651
// @description  Adds a menu command to find unsaved items in Google Photos.
// @author       Sherbeeny (via Jules the AI Agent)
// @match        https://photos.google.com/*
// @grant        GM_registerMenuCommand
// @grant        GM_addStyle
// @grant        GM_info
// @noframes
// ==/UserScript==
(function() {
    'use strict';
    console.log(`GPUF: Script version ${GM_info.script.version}`);
    if (typeof GM_addStyle === 'undefined') { global.GM_addStyle = () => {}; }
    if (typeof GM_registerMenuCommand === 'undefined') { global.GM_registerMenuCommand = () => {}; }
    if (typeof GM_info === 'undefined') { global.GM_info = { script: { version: 'test-version' } }; }
    function createUI() {
        const container = document.createElement('div');
        const content = document.createElement('div');
        content.textContent = 'Aha!';
        container.appendChild(content);
        const closeButton = document.createElement('button');
        closeButton.textContent = 'Close';
        container.appendChild(closeButton);
        return container;
    }
    function start() {
        GM_addStyle(`
            .gpf-window {
                position: fixed; top: 20%; left: 50%; transform: translateX(-50%);
                background-color: white; border: 1px solid #ccc; box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                padding: 2rem; z-index: 99999; text-align: center; font-family: sans-serif; color: #333;
            }
            .gpf-window div { font-size: 1.5rem; margin-bottom: 1rem; }
        `);
        const ui = createUI();
        ui.classList.add('gpf-window');
        const closeButton = ui.querySelector('button');
        closeButton.addEventListener('click', () => { ui.remove(); });
        document.body.appendChild(ui);
    }
    GM_registerMenuCommand('Start Google Photos Unsaved Finder', start);
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { createUI };
    }
})();
