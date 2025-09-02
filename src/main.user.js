// ==UserScript==
// @name         Google Photos Unsaved Finder
// @namespace    http://tampermonkey.net/
// @version      2025.09.01-1959
// @description  Adds a menu command to find unsaved items in Google Photos.
// @author       Sherbeeny (via Jules the AI Agent)
// @match        https://photos.google.com/*
// @grant        GM_registerMenuCommand
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';

    // Mock Tampermonkey functions for the Node.js testing environment
    if (typeof GM_addStyle === 'undefined') {
        global.GM_addStyle = () => {};
    }
    if (typeof GM_registerMenuCommand === 'undefined') {
        global.GM_registerMenuCommand = () => {};
    }

    /**
     * Creates the main UI window for the script.
     * @returns {HTMLDivElement} The main container element of the UI.
     */
    function createUI() {
        // Per the test, we need a container div.
        const container = document.createElement('div');

        // It must contain a div with the text "Aha!".
        const content = document.createElement('div');
        content.textContent = 'Aha!';
        container.appendChild(content);

        // It must also contain a button with the text "Close".
        const closeButton = document.createElement('button');
        closeButton.textContent = 'Close';
        container.appendChild(closeButton);

        return container;
    }

    // --- Userscript Bootstrapping ---

    /**
     * The main function to be executed when the menu command is clicked.
     */
    function start() {
        // Add the CSS styles for our UI window.
        GM_addStyle(`
            .gpf-window {
                position: fixed;
                top: 20%;
                left: 50%;
                transform: translateX(-50%);
                background-color: white;
                border: 1px solid #ccc;
                box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                padding: 2rem;
                z-index: 99999;
                text-align: center;
                font-family: sans-serif;
            }
        `);

        const ui = createUI();
        ui.classList.add('gpf-window');

        // Add the logic for the close button.
        const closeButton = ui.querySelector('button');
        closeButton.addEventListener('click', () => {
            ui.remove();
        });

        document.body.appendChild(ui);
    }

    // Register the menu command with Tampermonkey.
    // This is the entry point of our script.
    GM_registerMenuCommand('Start Google Photos Unsaved Finder', start);


    // --- Testability Export ---
    // This block is for testing purposes only and is not used by the userscript itself.
    // In a production environment, this would typically be removed by a build process.
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { createUI };
    }
})();
