// Mock the global Tampermonkey functions and objects before the script is required.
global.GM_addStyle = jest.fn();
global.GM_registerMenuCommand = jest.fn();
global.GM_info = { script: { version: 'test-version' } };
global.unsafeWindow = {};

// By requiring the script, we allow Jest to instrument it for coverage.
const { start, loadAlbumData, startProcessing } = require('../src/google_photos_unsaved_finder.user.js');

describe('API - Album Loading', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
        // Mock the entire API for this test suite
        unsafeWindow.gptkApi = {
            getAlbums: jest.fn(),
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('should populate album dropdowns and show a loading state', async () => {
        // Acceptance criteria: The UI shows a loading message, then populates the album lists.

        const mockAlbums = [
            { id: 'album1', title: 'Cats' },
            { id: 'album2', title: 'Dogs' },
        ];
        // Create a promise that we can resolve manually to test both states
        let resolveGetAlbums;
        const getAlbumsPromise = new Promise(resolve => {
            resolveGetAlbums = resolve;
        });
        unsafeWindow.gptkApi.getAlbums.mockReturnValue(getAlbumsPromise);

        // --- Test 1: Check the loading state ---
        start(); // This should trigger the album loading

        const sourceSelect = document.querySelector('.gpf-source-album-select');
        const destSelect = document.querySelector('.gpf-dest-album-select');

        expect(sourceSelect.disabled).toBe(true);
        expect(sourceSelect.textContent).toBe('Refreshing albums...');
        expect(destSelect.disabled).toBe(true);
        expect(destSelect.textContent).toBe('Refreshing albums...');

        // --- Test 2: Check the populated state ---

        // Now, resolve the promise to simulate the API call finishing
        await resolveGetAlbums(mockAlbums);

        // The UI should now be updated.
        expect(sourceSelect.disabled).toBe(false);
        expect(destSelect.disabled).toBe(false);

        const sourceOptions = sourceSelect.querySelectorAll('option');
        expect(sourceOptions).toHaveLength(3); // "Select All" + 2 albums
        expect(sourceOptions[0].textContent).toBe('Select All');
        expect(sourceOptions[1].value).toBe('album1');
        expect(sourceOptions[1].textContent).toBe('Cats');

        const destOptions = destSelect.querySelectorAll('option');
        expect(destOptions).toHaveLength(3); // "Select one" + 2 albums
        expect(destOptions[0].textContent).toBe('-- Select an album --');
        expect(destOptions[1].value).toBe('album1');
        expect(destOptions[1].textContent).toBe('Cats');
    });
});

describe('API - Core Processing', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
        // Mock the API for this suite
        unsafeWindow.gptkApi = {
            // Provide a mock album for selection
            getAlbums: jest.fn().mockResolvedValue([{ id: 'album1', title: 'Test Album' }]),
            getAlbumMediaItems: jest.fn(),
            getItemInfo: jest.fn(),
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('should process items in batches and filter correctly', async () => {
        // Acceptance criteria: The script must process items in batches and correctly filter them.

        // 1. Setup Mocks
        const mockMediaItems = [ { id: 'item1' }, { id: 'item2' }, { id: 'item3' }, { id: 'item4' } ];
        unsafeWindow.gptkApi.getAlbumMediaItems.mockResolvedValue(mockMediaItems);

        unsafeWindow.gptkApi.getItemInfo
            .mockResolvedValueOnce({ id: 'item1', savedToYourPhotos: true })
            .mockResolvedValueOnce({ id: 'item2', savedToYourPhotos: false })
            .mockResolvedValueOnce({ id: 'item3', savedToYourPhotos: true })
            .mockResolvedValueOnce({ id: 'item4', savedToYourPhotos: false });

        // 2. Setup UI State and wait for it to be ready
        start();
        const ui = document.body.firstChild;

        // We must wait for the async loadAlbumData to complete before proceeding.
        // Awaiting a macrotask (like setTimeout) or microtask ensures the DOM has updated.
        await new Promise(resolve => process.nextTick(resolve));

        const logWindow = ui.querySelector('.gpf-log-window');
        const sourceSelect = ui.querySelector('.gpf-source-album-select');
        const filterNotSaved = ui.querySelector('input[name="filter"][value="not-saved"]');
        const batchSizeInput = ui.querySelector('.gpf-batch-size-input');

        // Simulate user selections
        const sourceOption = ui.querySelector('option[value="album1"]');
        sourceOption.selected = true;
        filterNotSaved.checked = true;
        batchSizeInput.value = '2';

        // 3. Action
        const matchedItems = await startProcessing(ui);

        // 4. Assertions
        expect(unsafeWindow.gptkApi.getAlbumMediaItems).toHaveBeenCalledWith('album1');
        expect(unsafeWindow.gptkApi.getItemInfo).toHaveBeenCalledTimes(4);

        // Check log window for correct progress updates
        expect(logWindow.innerHTML).toContain('Processing batch 1 of 2...');
        expect(logWindow.innerHTML).toContain('Processing batch 2 of 2...');
        expect(logWindow.innerHTML).toContain('Scan complete. Found 2 matching items.');

        // Check that the final result is correct
        expect(matchedItems).toEqual([
            { id: 'item2', savedToYourPhotos: false },
            { id: 'item4', savedToYourPhotos: false }
        ]);
    });
});
