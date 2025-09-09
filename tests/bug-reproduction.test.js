// This file is for writing new tests that reproduce the specific bugs
// reported in the project prompt.

// Mock the global Tampermonkey functions and objects before the script is required.
global.GM_addStyle = jest.fn();
global.GM_registerMenuCommand = jest.fn();
global.GM_info = { script: { version: 'test-version' } };
global.unsafeWindow = {};

const { start, loadAlbumData, startProcessing } = require('../src/google_photos_unsaved_finder.user.js');

describe('Bug Reproduction Tests', () => {

    beforeEach(() => {
        document.body.innerHTML = '';
        // Mock the gptkApi for each test
        unsafeWindow.gptkApi = {
            getAlbums: jest.fn(),
            getAlbumPage: jest.fn(),
            getItemInfo: jest.fn(),
        };
        // Spy on console.error to check for logging
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('[TDD Red] Bug: Silent Crash on Startup', async () => {
        // Acceptance Criteria: If loading albums fails, the script should not crash
        // and should log an error to the UI and the console.

        // 1. Setup: Mock the API to fail
        const startupError = new Error('Forced API failure');
        // The bug is in the `start` function which calls `loadAlbumData` internally.
        // The script itself calls `loadAlbumData`, so we mock the underlying `getAlbums`.
        unsafeWindow.gptkApi.getAlbums.mockRejectedValue(startupError);

        // 2. Action: Run the startup function
        start();

        // 3. Assertion: Check for graceful failure
        // We need to wait for the promise rejection to be processed by the script.
        await new Promise(resolve => process.nextTick(resolve));

        const logWindow = document.querySelector('.gpf-log-window');
        // The script should fail here because it doesn't `await` the promise,
        // so the catch block is never triggered. The log window will be empty.
        expect(logWindow.textContent).toContain('Error loading albums');
        expect(console.error).toHaveBeenCalledWith('GPUF: Error loading albums', startupError);
    });

    test('[TDD Red] Bug: Incorrect Album Data Parsing', async () => {
        // Acceptance Criteria: The script must parse album data from `response.items`
        // and use `album.mediaKey` for the value.

        // 1. Setup: Mock the API response with the correct data structure
        const mockApiResponse = {
            items: [ // The key is `items`, not `albums`
                { mediaKey: 'key1', title: 'Album One' }, // The key is `mediaKey`, not `id`
                { mediaKey: 'key2', title: 'Album Two' },
            ]
        };
        unsafeWindow.gptkApi.getAlbums.mockResolvedValue(mockApiResponse);

        // 2. Action: Create the UI and call the data loading function
        start(); // This will create the UI and call loadAlbumData
        await new Promise(resolve => process.nextTick(resolve)); // Wait for the DOM to update

        // 3. Assertion: Check if the checklist was populated correctly
        const sourceChecklist = document.querySelector('.gpf-source-album-checklist');
        const checkboxes = sourceChecklist.querySelectorAll('input[type="checkbox"]');

        expect(checkboxes.length).toBe(3); // "Select All" + 2 albums

        const firstAlbumCheckbox = sourceChecklist.querySelector('input[value="key1"]');
        expect(firstAlbumCheckbox).not.toBeNull();

        const label = sourceChecklist.querySelector('label[for="gpf-album-key1"]');
        expect(label.textContent).toBe('Album One');
    });

    test('[TDD Red] Bug: Incorrect getAlbumMediaItems function name', async () => {
        // Acceptance Criteria: The script must call the correct GPTK API function to get album media.

        // 1. Setup: Mock the gptkApi with the correct function name
        unsafeWindow.gptkApi.getAlbumPage.mockResolvedValue({ items: [] });
        unsafeWindow.gptkApi.getAlbums.mockResolvedValue({ items: [{ mediaKey: 'album1', title: 'My Album' }] });

        // 2. Action: Start the UI and the processing.
        start();
        await new Promise(resolve => process.nextTick(resolve)); // Wait for albums to load

        const ui = document.querySelector('.gpf-window');
        const sourceChecklist = ui.querySelector('.gpf-source-album-checklist');
        sourceChecklist.querySelector('input[value="album1"]').checked = true;

        const startButton = ui.querySelector('.gpf-start-button');

        await startProcessing(ui);

        expect(unsafeWindow.gptkApi.getAlbumPage).toHaveBeenCalledWith('album1');
    });
});
