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

    it('should get item info correctly for a non-shared album item', async () => {
        const mockItemInfoData = [
            [ "photo_1", null, null, null, null, [] ] // The presence of [] at index 5 means "saved".
        ];
        mockFetch.mockResolvedValueOnce(createMockApiResponse('VrseUb', mockItemInfoData));

        // Call with isShared = false
        const result = await userscript.getItemInfo(mockFetch, mockWindowGlobalData, mockWindowGlobalData.pathname, 'photo_1', false);

        expect(mockFetch).toHaveBeenCalled();
        const requestBody = mockFetch.mock.calls[0][1].body;
        expect(requestBody).toContain('VrseUb'); // Ensure correct rpcid
        expect(result.success).toBe(true);
        expect(result.data.savedToYourPhotos).toBe(true);
    });

    it('should get item info correctly for a shared album item', async () => {
        // Mock data for the 'fDcn4b' rpcid. A saved item has a non-null value at [5][0][0].
        const mockItemInfoSharedData = [[ "photo_shared_1", null, null, null, null, [[["some_value"]]] ]];
        mockFetch.mockResolvedValueOnce(createMockApiResponse('fDcn4b', mockItemInfoSharedData));

        // Call with isShared = true
        const result = await userscript.getItemInfo(mockFetch, mockWindowGlobalData, mockWindowGlobalData.pathname, 'photo_shared_1', true);

        expect(mockFetch).toHaveBeenCalled();
        const requestBody = mockFetch.mock.calls[0][1].body;
        expect(requestBody).toContain('fDcn4b'); // Ensure correct rpcid
        expect(result.success).toBe(true);
        expect(result.data.savedToYourPhotos).toBe(true);
        expect(result.data.mediaKey).toBe('photo_shared_1');
    });


    it('should handle errors when getting item info', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Network error'));
        const result = await userscript.getItemInfo(mockFetch, mockWindowGlobalData, mockWindowGlobalData.pathname, 'photo_1', false);
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
    it('should execute the full processing logic, handling both shared and non-shared albums', async () => {
        const log = jest.fn();
        const getUiState = () => ({
            selectedAlbums: [
                { mediaKey: 'album_id_shared', isShared: true, title: 'Shared Album' },
                { mediaKey: 'album_id_private', isShared: false, title: 'Private Album' }
            ],
            filter: 'not-saved',
            destinationAlbum: { mediaKey: 'album_id_dest', isShared: true },
        });

        // --- Mock API Responses ---
        // Page for SHARED album -> contains one saved, one unsaved
        const sharedAlbumPage = [null, [['photo_s_unsaved'], ['photo_s_saved']]];
        // Page for PRIVATE album -> contains one saved, one unsaved
        const privateAlbumPage = [null, [['photo_p_unsaved'], ['photo_p_saved']]];

        // Item info for SHARED album items (using fDcn4b)
        // An unsaved item has a null value at index 5.
        const itemInfoSharedUnsaved = [[ 'photo_s_unsaved', null, null, null, null, null ]];       // Unsaved
        const itemInfoSharedSaved = [[ 'photo_s_saved', null, null, null, null, [[["value"]]] ]];   // Saved

        // Item info for PRIVATE album items (using VrseUb)
        const itemInfoPrivateUnsaved = [ ['photo_p_unsaved'] ]; // Unsaved
        const itemInfoPrivateSaved = [ ['photo_p_saved', null, null, null, null, []] ]; // Saved


        mockFetch
            // --- First Album (Shared) ---
            .mockResolvedValueOnce(createMockApiResponse('snAcKc', sharedAlbumPage))      // getAlbumPage for shared album
            .mockResolvedValueOnce(createMockApiResponse('fDcn4b', itemInfoSharedUnsaved)) // getItemInfo for photo_s_unsaved
            .mockResolvedValueOnce(createMockApiResponse('fDcn4b', itemInfoSharedSaved))   // getItemInfo for photo_s_saved
            // --- Second Album (Private) ---
            .mockResolvedValueOnce(createMockApiResponse('snAcKc', privateAlbumPage))       // getAlbumPage for private album
            .mockResolvedValueOnce(createMockApiResponse('VrseUb', itemInfoPrivateUnsaved)) // getItemInfo for photo_p_unsaved
            .mockResolvedValueOnce(createMockApiResponse('VrseUb', itemInfoPrivateSaved))   // getItemInfo for photo_p_saved
            // --- Final Add Call ---
            .mockResolvedValueOnce(createMockApiResponse('laUYf', null)); // addItemsToSharedAlbum

        await userscript.startProcessing(mockFetch, mockWindowGlobalData, mockWindowGlobalData.pathname, log, getUiState);

        // Check logs for correct flow
        expect(log).toHaveBeenCalledWith('Fetching media items from album: Shared Album...');
        expect(log).toHaveBeenCalledWith('Found 2 items in album. Checking their status...');
        expect(log).toHaveBeenCalledWith('Fetching media items from album: Private Album...');
        expect(log).toHaveBeenCalledWith('Found 2 items in album. Checking their status...');
        expect(log).toHaveBeenCalledWith('Scanned 4 total items across all selected albums.');
        expect(log).toHaveBeenCalledWith('Found 2 matching items.');
        expect(log).toHaveBeenCalledWith('Adding 2 items to destination album...');
        expect(log).toHaveBeenCalledWith('Successfully added batch of 2 items.');


        // Verify that the correct rpcids were used for getItemInfo
        const getItemInfoCalls = mockFetch.mock.calls.filter(call => call[0].includes('VrseUb') || call[0].includes('fDcn4b'));
        expect(getItemInfoCalls.length).toBe(4);
        expect(getItemInfoCalls[0][0]).toContain('fDcn4b'); // photo_s_unsaved
        expect(getItemInfoCalls[1][0]).toContain('fDcn4b'); // photo_s_saved
        expect(getItemInfoCalls[2][0]).toContain('VrseUb'); // photo_p_unsaved
        expect(getItemInfoCalls[3][0]).toContain('VrseUb'); // photo_p_saved


        // Verify the final API call to add items
        const lastFetchCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
        const requestBody = lastFetchCall[1].body;
        expect(requestBody).toContain('laUYf');
        expect(requestBody).toContain('photo_s_unsaved'); // Unsaved from shared
        expect(requestBody).toContain('photo_p_unsaved'); // Unsaved from private
        expect(requestBody).not.toContain('photo_s_saved');
        expect(requestBody).not.toContain('photo_p_saved');
    });

    it('should handle a null response from getItemInfo without crashing', async () => {
        const log = jest.fn();
        const getUiState = () => ({
            selectedAlbums: [{ mediaKey: 'album_id_1', isShared: false, title: 'Test Album' }],
            filter: 'not-saved',
            destinationAlbum: { mediaKey: 'album_id_2', isShared: false },
        });

        const albumPageData = [null, [['photo_1']]];

        mockFetch
            .mockResolvedValueOnce(createMockApiResponse('snAcKc', albumPageData)) // getAlbumPage
            .mockResolvedValueOnce(createMockApiResponse('VrseUb', null)); // getItemInfo returns null

        await userscript.startProcessing(mockFetch, mockWindowGlobalData, mockWindowGlobalData.pathname, log, getUiState);

        expect(log).toHaveBeenCalledWith(expect.stringContaining('Error getting item info:'));
        expect(log).toHaveBeenCalledWith(expect.stringContaining('API returned null or undefined response for item.'));
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
            selectedAlbums: [{ mediaKey: 'album_id_1', isShared: false, title: 'Test Album' }],
            filter: 'not-saved',
            destinationAlbum: { mediaKey: 'album_id_2', isShared: true },
        });

        // Mock the sequence of fetch calls
        const albumPageData = [null, [['photo_1_unsaved']]];
        const itemInfoUnsaved = [ ['photo_1_unsaved'] ];

        mockFetch
            .mockResolvedValueOnce(createMockApiResponse('snAcKc', albumPageData)) // getAlbumPage
            .mockResolvedValueOnce(createMockApiResponse('VrseUb', itemInfoUnsaved)) // getItemInfo for photo 1
            .mockResolvedValueOnce(createMockApiResponse('laUYf', [])); // addItemsToSharedAlbum -> SILENT FAILURE

        await userscript.startProcessing(mockFetch, mockWindowGlobalData, mockWindowGlobalData.pathname, log, getUiState);

        // Check logs
        expect(log).toHaveBeenCalledWith('Adding 1 items to destination album...');
        expect(log).toHaveBeenCalledWith('Error: Failed to add batch of 1 items. API returned an unexpected response.. Response: []');
        expect(log).not.toHaveBeenCalledWith('Successfully added batch of 1 items.');
    });

    // --- Testing Parsers ---
    describe('Parsers', () => {
        it('albumParse should correctly identify a private album', () => {
            const mockPrivateAlbumData = [
                "album_id_private", ["thumbnail_url"], null, null, null, null, null,
                { "72930366": [null, "Private Album Title", null, 42, true] }
            ];
            const parsed = userscript.albumParse(mockPrivateAlbumData);
            expect(parsed.isShared).toBe(false);
        });

        it('itemInfoParse should correctly identify a saved item via new logic', () => {
            const mockSavedItemData = [
                [ "item_id_saved", null, null, null, null, [], null, null, null, null, null, null, null, null, null, {} ]
            ];
            const parsed = userscript.itemInfoParse(mockSavedItemData);
            expect(parsed.savedToYourPhotos).toBe(true);
        });

        it('itemInfoSharedParse should correctly identify a saved item', () => {
            const mockSavedItemData = [ "item_id_saved", null, null, null, null, [[["some_value"]]] ];
            const parsed = userscript.itemInfoSharedParse(mockSavedItemData);
            expect(parsed.savedToYourPhotos).toBe(true);
        });

        it('itemInfoSharedParse should correctly identify an unsaved item', () => {
            const mockUnsavedItemData = [ "item_id_unsaved", null, null, null, null, null ];
            const parsed = userscript.itemInfoSharedParse(mockUnsavedItemData);
            expect(parsed.savedToYourPhotos).toBe(false);
        });
    });

    it('should batch additions to albums in chunks of 50', async () => {
        const log = jest.fn();
        const getUiState = () => ({
            selectedAlbums: [{ mediaKey: 'album_id_1', isShared: true, title: 'Test Album' }],
            filter: 'not-saved',
            destinationAlbum: { mediaKey: 'album_id_2', isShared: true },
        });

        // Create 75 mock items
        const mockItems = Array.from({ length: 75 }, (_, i) => ([`photo_${i}`]));

        // Mock the API calls
        mockFetch.mockResolvedValueOnce(createMockApiResponse('snAcKc', [null, mockItems])); // getAlbumPage
        for (let i = 0; i < 75; i++) {
            // Mocking as unsaved for a shared album
            mockFetch.mockResolvedValueOnce(createMockApiResponse('fDcn4b', [[ `photo_${i}`, null, null, null, null, null ]]));
        }
        mockFetch.mockResolvedValueOnce(createMockApiResponse('laUYf', null)); // addItemsToSharedAlbum
        mockFetch.mockResolvedValueOnce(createMockApiResponse('laUYf', null)); // addItemsToSharedAlbum

        await userscript.startProcessing(mockFetch, mockWindowGlobalData, mockWindowGlobalData.pathname, log, getUiState);

        const addItemsCalls = mockFetch.mock.calls.filter(call => call[0].includes('laUYf'));

        expect(addItemsCalls.length).toBe(2);

        const firstBatchBody = JSON.parse(decodeURIComponent(addItemsCalls[0][1].body.split('&')[0].split('=')[1]));
        const secondBatchBody = JSON.parse(decodeURIComponent(addItemsCalls[1][1].body.split('&')[0].split('=')[1]));

        const firstBatchMediaKeys = JSON.parse(firstBatchBody[0][0][1])[1][2];
        const secondBatchMediaKeys = JSON.parse(secondBatchBody[0][0][1])[1][2];

        expect(firstBatchMediaKeys.length).toBe(50);
        expect(secondBatchMediaKeys.length).toBe(25);
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
