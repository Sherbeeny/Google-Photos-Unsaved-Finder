// This file tests the interaction between the UI and the mocked gptkApi.
// It ensures that album data is loaded correctly and that the core processing
// logic functions as expected.

// Mock the global Tampermonkey functions and objects.
global.GM_addStyle = jest.fn();
global.GM_registerMenuCommand = jest.fn();
global.GM_info = { script: { version: 'test-version' } };
global.unsafeWindow = {};

// Import the functions to be tested.
const { createUI, loadAlbumData, startProcessing } = require('../src/google_photos_unsaved_finder.user.js');

describe('API - Album Loading', () => {
    let sourceContainer;
    let destSelect;
    let ui;

    beforeEach(() => {
        // Create a fresh UI for each test.
        ui = createUI();
        document.body.appendChild(ui);
        sourceContainer = document.querySelector('.gpf-source-album-checklist');
        destSelect = document.querySelector('.gpf-dest-album-select');
    });

    afterEach(() => {
        // Clean up the DOM.
        document.body.innerHTML = '';
        jest.clearAllMocks();
    });

    test('should populate album checklist and show a loading state', async () => {
        // Acceptance criteria: The UI should indicate that albums are being loaded.
        const mockAlbums = { items: [{ mediaKey: 'album1', title: 'Test Album' }] };
        unsafeWindow.gptkApi = {
            getAlbums: jest.fn().mockResolvedValue(mockAlbums),
        };

        // The loadAlbumData function is async, so we can await its completion.
        const loadPromise = loadAlbumData(sourceContainer, destSelect);

        // Immediately after calling, the UI should be in a loading state.
        expect(sourceContainer.classList.contains('gpf-loading')).toBe(true);
        expect(sourceContainer.textContent).toBe('Refreshing albums...');
        expect(destSelect.disabled).toBe(true);
        expect(destSelect.textContent).toBe('Refreshing albums...');

        await loadPromise; // Wait for the loading to complete.

        // After completion, the checklist should be populated and enabled.
        expect(sourceContainer.classList.contains('gpf-loading')).toBe(false);
        expect(destSelect.disabled).toBe(false);
        const checkboxes = sourceContainer.querySelectorAll('input[type="checkbox"]');
        expect(checkboxes).toHaveLength(2); // "Select All" + 1 album
        expect(destSelect.options).toHaveLength(3); // "Select an album", "Create new", + 1 album
        expect(sourceContainer.textContent).toContain('Test Album');
    });

    test('should show "No albums found" if the API returns no albums', async () => {
        // Acceptance criteria: The UI should inform the user if no albums are available.
        unsafeWindow.gptkApi = {
            getAlbums: jest.fn().mockResolvedValue({ items: [] }),
        };

        await loadAlbumData(sourceContainer, destSelect);

        expect(sourceContainer.textContent).toBe('No albums found');
    });
});

describe('API - Core Processing', () => {
    let ui;

    beforeEach(() => {
        // Create a fresh UI for each test.
        ui = createUI();
        document.body.appendChild(ui);
    });

    afterEach(() => {
        // Clean up the DOM.
        document.body.innerHTML = '';
        jest.clearAllMocks();
    });

    test('should process items in batches and filter correctly', async () => {
        // Acceptance criteria: The core logic should fetch item details in batches and filter them.
        const mockMediaItems = [
            { id: 'item1' }, // Not saved
            { id: 'item2' }, // Saved
            { id: 'item3' }, // Not saved
            { id: 'item4' }, // Saved
        ];

        const mockItemInfos = {
            item1: { id: 'item1', savedToYourPhotos: false },
            item2: { id: 'item2', savedToYourPhotos: true },
            item3: { id: 'item3', savedToYourPhotos: false },
            item4: { id: 'item4', savedToYourPhotos: true },
        };

        // 1. Setup: Mock the API methods that will be called during processing.
        unsafeWindow.gptkApi = {
            getAlbumMediaItems: jest.fn().mockResolvedValue(mockMediaItems),
            getItemInfo: jest.fn(itemId => Promise.resolve(mockItemInfos[itemId])),
            getAlbums: jest.fn().mockResolvedValue({ items: [{ mediaKey: 'album1', title: 'My Album' }] }),
        };

        // Load some albums first
        const sourceContainer = ui.querySelector('.gpf-source-album-checklist');
        const destSelect = ui.querySelector('.gpf-dest-album-select');
        await loadAlbumData(sourceContainer, destSelect);

        // 2. Setup: Set the UI state (e.g., select an album, set batch size).
        sourceContainer.querySelector('input[value="album1"]').checked = true; // Simulate album selection
        ui.querySelector('.gpf-batch-size-input').value = '2'; // Process in batches of 2
        ui.querySelector('input[name="filter"][value="not-saved"]').checked = true; // Filter for not-saved items

        // 3. Action: Run the processing function.
        const matchedItems = await startProcessing(ui);

        // 4. Assertions
        expect(unsafeWindow.gptkApi.getAlbumMediaItems).toHaveBeenCalledWith('album1');
        expect(unsafeWindow.gptkApi.getItemInfo).toHaveBeenCalledTimes(4);

        // Check log window for correct progress updates
        const logWindow = ui.querySelector('.gpf-log-window');
        expect(logWindow.textContent).toContain('Processing batch 1 of 2...');
        expect(logWindow.textContent).toContain('Processing batch 2 of 2...');
        expect(logWindow.textContent).toContain('Scan complete. Found 2 matching items.');

        // Check the final result
        expect(matchedItems).toHaveLength(2);
        expect(matchedItems.map(item => item.id)).toEqual(['item1', 'item3']);
    });
});
