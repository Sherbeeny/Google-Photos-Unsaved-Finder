// tests/userscript.test.js

const userscript = require('../src/google_photos_unsaved_finder.user.js');

// Mock dependencies
const mockFetch = jest.fn();
const mockWindowGlobalData = {
  oPEP7c: 'test_account',
  FdrFJe: 'test_f.sid',
  cfb2h: 'test_bl',
  eptZe: '/_/',
  SNlM0e: 'test_at',
  pathname: '/test-path',
};

// --- Helper to create mock API responses ---
const createMockApiResponse = (rpcid, data) => {
    const innerJsonString = JSON.stringify(data);
    const responsePayload = ["wrb.fr", rpcid, innerJsonString];
    const fullResponseLine = JSON.stringify([responsePayload]);
    return {
        text: () => Promise.resolve(fullResponseLine),
    };
};


describe('Userscript Core Logic', () => {

    beforeEach(() => {
        mockFetch.mockClear();
        document.body.innerHTML = ''; // Clear DOM for UI tests
    });

    // --- Testing API Functions ---
    it('should fetch albums correctly', async () => {
        const mockAlbumData = [[["album_id_1", ["thumbnail_url_1"], null, null, null, null, ["owner_id_1"], {"72930366":[null,"Test Album 1",null,123,true]}]]];
        mockFetch.mockResolvedValueOnce(createMockApiResponse('Z5xsfc', mockAlbumData));

        const result = await userscript.getAlbums(mockFetch, mockWindowGlobalData, mockWindowGlobalData.pathname);

        expect(mockFetch).toHaveBeenCalled();
        expect(result.success).toBe(true);
        expect(result.data.length).toBe(1);
        expect(result.data[0].title).toBe('Test Album 1');
    });

    it('should handle errors when fetching albums', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Network error'));
        const result = await userscript.getAlbums(mockFetch, mockWindowGlobalData, mockWindowGlobalData.pathname);
        expect(result.success).toBe(false);
        expect(result.error).toBe('Network error');
    });

    it('should fetch an album page correctly', async () => {
        const mockAlbumPageData = [null, [['photo_1']]];
        mockFetch.mockResolvedValueOnce(createMockApiResponse('snAcKc', mockAlbumPageData));

        const result = await userscript.getAlbumPage(mockFetch, mockWindowGlobalData, mockWindowGlobalData.pathname, 'album_id_1');

        expect(mockFetch).toHaveBeenCalled();
        expect(result.success).toBe(true);
        expect(result.data.items.length).toBe(1);
        expect(result.data.items[0].mediaKey).toBe('photo_1');
    });

    it('should handle errors when fetching an album page', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Network error'));
        const result = await userscript.getAlbumPage(mockFetch, mockWindowGlobalData, mockWindowGlobalData.pathname, 'album_id_1');
        expect(result.success).toBe(false);
        expect(result.error).toBe('Network error');
    });

    it('should get item info correctly', async () => {
        // This mock data is updated for the new `itemInfoParse` logic.
        // It now includes the `[5]` array, which is the correct indicator for a saved item.
        const mockItemInfoData = [
            [ "photo_1", null, null, null, null, [] ] // The presence of [] at index 5 means "saved".
        ];
        mockFetch.mockResolvedValueOnce(createMockApiResponse('VrseUb', mockItemInfoData));

        const result = await userscript.getItemInfo(mockFetch, mockWindowGlobalData, mockWindowGlobalData.pathname, 'photo_1');

        expect(mockFetch).toHaveBeenCalled();
        expect(result.success).toBe(true);
        expect(result.data.savedToYourPhotos).toBe(true);
    });

    it('should handle errors when getting item info', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Network error'));
        const result = await userscript.getItemInfo(mockFetch, mockWindowGlobalData, mockWindowGlobalData.pathname, 'photo_1');
        expect(result.success).toBe(false);
        expect(result.error).toBe('Network error');
    });

    it('should add items to a shared album', async () => {
        mockFetch.mockResolvedValueOnce(createMockApiResponse('laUYf', null));

        const result = await userscript.addItemsToSharedAlbum(mockFetch, mockWindowGlobalData, mockWindowGlobalData.pathname, ['photo_1'], 'album_id_2');

        expect(mockFetch).toHaveBeenCalled();
        expect(result.success).toBe(true);
        const requestBody = mockFetch.mock.calls[0][1].body;
        expect(requestBody).toContain('photo_1');
        expect(requestBody).toContain('album_id_2');
    });

    it('should add items to a non-shared album', async () => {
        mockFetch.mockResolvedValueOnce(createMockApiResponse('E1Cajb', [1]));

        const result = await userscript.addItemsToNonSharedAlbum(mockFetch, mockWindowGlobalData, mockWindowGlobalData.pathname, ['photo_1'], 'album_id_2');

        expect(mockFetch).toHaveBeenCalled();
        expect(result.success).toBe(true);
        const requestBody = mockFetch.mock.calls[0][1].body;
        expect(requestBody).toContain('photo_1');
        expect(requestBody).toContain('album_id_2');
    });

    it('should handle errors when adding items to an album', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Network error'));
        const result = await userscript.addItemsToSharedAlbum(mockFetch, mockWindowGlobalData, mockWindowGlobalData.pathname, ['photo_1'], 'album_id_2');
        expect(result.success).toBe(false);
        expect(result.error).toBe('Network error');
    });

    // --- Testing the main processing function ---
    it('should execute the full processing logic for a shared album', async () => {
        const log = jest.fn();
        const getUiState = () => ({
            selectedAlbums: ['album_id_1'],
            filter: 'not-saved',
            destinationAlbum: { mediaKey: 'album_id_2', isShared: true },
        });

        // Mock the sequence of fetch calls with updated item info data structures
        const albumPageData = [null, [['photo_1_unsaved'], ['photo_2_saved']]];
        // Unsaved item: No array at index 5
        const itemInfoUnsaved = [ ['photo_1_unsaved'] ];
        // Saved item: Has an empty array at index 5
        const itemInfoSaved = [ ['photo_2_saved', null, null, null, null, []] ];

        mockFetch
            .mockResolvedValueOnce(createMockApiResponse('snAcKc', albumPageData)) // getAlbumPage
            .mockResolvedValueOnce(createMockApiResponse('VrseUb', itemInfoUnsaved)) // getItemInfo for photo 1
            .mockResolvedValueOnce(createMockApiResponse('VrseUb', itemInfoSaved))   // getItemInfo for photo 2
            .mockResolvedValueOnce(createMockApiResponse('laUYf', null)); // addItemsToSharedAlbum

        await userscript.startProcessing(mockFetch, mockWindowGlobalData, mockWindowGlobalData.pathname, log, getUiState);

        // Check logs
        expect(log).toHaveBeenCalledWith('Starting processing...');
        expect(log).toHaveBeenCalledWith('Found 1 matching items.');
        expect(log).toHaveBeenCalledWith('Adding 1 items to destination album...');
        expect(log).toHaveBeenCalledWith('Successfully added items to the album.');

        // Verify the final API call to add items
        const lastFetchCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
        const requestBody = lastFetchCall[1].body;
        expect(requestBody).toContain('laUYf');
        expect(requestBody).toContain('photo_1_unsaved'); // Only the unsaved photo should be added
        expect(requestBody).not.toContain('photo_2_saved');
    });

    it('should execute the full processing logic for a non-shared album', async () => {
        const log = jest.fn();
        const getUiState = () => ({
            selectedAlbums: ['album_id_1'],
            filter: 'not-saved',
            destinationAlbum: { mediaKey: 'album_id_2', isShared: false },
        });

        // Mock the sequence of fetch calls with updated item info data structures
        const albumPageData = [null, [['photo_1_unsaved'], ['photo_2_saved']]];
        // Unsaved item: No array at index 5
        const itemInfoUnsaved = [ ['photo_1_unsaved'] ];
        // Saved item: Has an empty array at index 5
        const itemInfoSaved = [ ['photo_2_saved', null, null, null, null, []] ];

        mockFetch
            .mockResolvedValueOnce(createMockApiResponse('snAcKc', albumPageData)) // getAlbumPage
            .mockResolvedValueOnce(createMockApiResponse('VrseUb', itemInfoUnsaved)) // getItemInfo for photo 1
            .mockResolvedValueOnce(createMockApiResponse('VrseUb', itemInfoSaved))   // getItemInfo for photo 2
            .mockResolvedValueOnce(createMockApiResponse('E1Cajb', [1])); // addItemsToNonSharedAlbum

        await userscript.startProcessing(mockFetch, mockWindowGlobalData, mockWindowGlobalData.pathname, log, getUiState);

        // Check logs
        expect(log).toHaveBeenCalledWith('Starting processing...');
        expect(log).toHaveBeenCalledWith('Found 1 matching items.');
        expect(log).toHaveBeenCalledWith('Adding 1 items to destination album...');
        expect(log).toHaveBeenCalledWith('Successfully added items to the album.');

        // Verify the final API call to add items
        const lastFetchCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
        const requestBody = lastFetchCall[1].body;
        expect(requestBody).toContain('E1Cajb');
        expect(requestBody).toContain('photo_1_unsaved'); // Only the unsaved photo should be added
        expect(requestBody).not.toContain('photo_2_saved');
    });

    it('should handle empty selected albums in processing', async () => {
        const log = jest.fn();
        const getUiState = () => ({
            selectedAlbums: [],
            filter: 'not-saved',
            destination: 'album_id_2',
        });

        await userscript.startProcessing(mockFetch, mockWindowGlobalData, mockWindowGlobalData.pathname, log, getUiState);

        expect(log).toHaveBeenCalledWith('No source albums selected.');
    });

    it('should handle empty destination album in processing', async () => {
        const log = jest.fn();
        const getUiState = () => ({
            selectedAlbums: ['album_id_1'],
            filter: 'not-saved',
            destination: '',
        });

        await userscript.startProcessing(mockFetch, mockWindowGlobalData, mockWindowGlobalData.pathname, log, getUiState);

        expect(log).toHaveBeenCalledWith('No destination album selected.');
    });

    it('should log a failure message when adding items fails silently', async () => {
        const log = jest.fn();
        const getUiState = () => ({
            selectedAlbums: ['album_id_1'],
            filter: 'not-saved',
            destinationAlbum: { mediaKey: 'album_id_2', isShared: true },
        });

        // Mock the sequence of fetch calls
        const albumPageData = [null, [['photo_1_unsaved']]];
        const itemInfoUnsaved = [ ['photo_1_unsaved', null, null, null, null, null, null, null, null, null, null, null, null, null, null, {'163238866': []}] ];

        mockFetch
            .mockResolvedValueOnce(createMockApiResponse('snAcKc', albumPageData)) // getAlbumPage
            .mockResolvedValueOnce(createMockApiResponse('VrseUb', itemInfoUnsaved)) // getItemInfo for photo 1
            .mockResolvedValueOnce(createMockApiResponse('laUYf', [])); // addItemsToSharedAlbum -> SILENT FAILURE

        await userscript.startProcessing(mockFetch, mockWindowGlobalData, mockWindowGlobalData.pathname, log, getUiState);

        // Check logs
        expect(log).toHaveBeenCalledWith('Adding 1 items to destination album...');
        expect(log).toHaveBeenCalledWith('Error: Failed to add items to the album. API returned an unexpected response.. Response: []');
        expect(log).not.toHaveBeenCalledWith('Successfully added items to the album.');
    });

    // --- Testing Parsers ---
    describe('Parsers', () => {
        it('albumParse should correctly identify a private album', () => {
            // This mock data is designed to make the OLD logic fail.
            // A private album won't have sharing info at index 7.
            // However, the old logic incorrectly checks the last element's metadata (`[4]`), which can be true
            // for reasons other than sharing, causing a private album to be treated as shared.
            const mockPrivateAlbumData = [
                "album_id_private",
                ["thumbnail_url"], null, null, null, null, null,
                // No element at index 7, which is what the NEW logic will correctly check for.
                { "72930366": [null, "Private Album Title", null, 42, true] } // Old logic sees `true` here and fails.
            ];
            const parsed = userscript.albumParse(mockPrivateAlbumData);
            expect(parsed.isShared).toBe(false);
        });

        it('itemInfoParse should correctly identify a saved item via new logic', () => {
            // This mock data represents a saved item that the old logic misses.
            // The old logic checks `[15][163238866]`, which is absent here.
            // The new logic correctly identifies the item as saved by the presence of the `[5]` array.
            const mockSavedItemData = [
                [
                    "item_id_saved",
                    null, null, null, null,
                    [], // Index 5: Presence of this array indicates "saved"
                    null, null, null, null, null, null, null, null, null,
                    {} // Index 15: The old check looks here and fails
                ]
            ];
            const parsed = userscript.itemInfoParse(mockSavedItemData);
            expect(parsed.savedToYourPhotos).toBe(true);
        });
    });

    // --- Testing UI Creation (basic) ---
    it('should create the full UI structure programmatically', async () => {
        // Mock the getAlbums call that createUI depends on
        const mockAlbumData = [[["album_id_1", ["thumbnail_url_1"], null, null, null, null, ["owner_id_1"], {"72930366":[null,"Test Album 1",null,123,true]}]]];
        const mockApiResponse = createMockApiResponse('Z5xsfc', mockAlbumData);

        // JSDOM's fetch is not the same as the global fetch, so we mock it specifically here.
        global.fetch = jest.fn(() => Promise.resolve(mockApiResponse));

        // Mock Tampermonkey functions for this test
        global.GM_addStyle = jest.fn();
        global.unsafeWindow = { WIZ_global_data: mockWindowGlobalData };

        userscript.createUI();

        // Allow for the async getAlbums call to complete
        await new Promise(resolve => setTimeout(resolve, 0));

        // Check for all major UI components
        expect(document.querySelector('.gpuf-modal-overlay')).not.toBeNull();
        expect(document.querySelector('.gpuf-modal')).not.toBeNull();
        expect(document.querySelector('.gpuf-modal-header h2')).not.toBeNull();
        expect(document.querySelector('.gpuf-close-button')).not.toBeNull();
        expect(document.querySelector('.gpuf-album-list')).not.toBeNull();
        expect(document.querySelector('.gpuf-filter-controls')).not.toBeNull();
        expect(document.querySelectorAll('input[name="filter"]').length).toBe(3);
        expect(document.querySelector('.gpuf-destination-controls')).not.toBeNull();
        expect(document.querySelector('#destination-album')).not.toBeNull();
        expect(document.querySelector('.gpuf-start-button')).not.toBeNull();
        expect(document.querySelector('.gpuf-log-viewer')).not.toBeNull();

        // Check that the album list was populated
        expect(document.querySelectorAll('.gpuf-album-list label').length).toBe(1);
        expect(document.querySelector('.gpuf-album-list label').textContent).toContain('Test Album 1');
        expect(document.querySelectorAll('#destination-album option').length).toBe(1);
        expect(document.querySelector('#destination-album option').textContent).toBe('Test Album 1');
    });
});
