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

    it('should get item info correctly for a SAVED item', async () => {
        // Mock data for a SAVED item, containing the key in the final object
        const mockSavedItemData = [
            [
                "saved_media_key", null, null, null, null, null, null, null, null,
                { "15": 275865, "163238866": [false, "some_id"] }
            ]
        ];
        mockFetch.mockResolvedValueOnce(createMockApiResponse('VrseUb', mockSavedItemData));

        // Call the simplified getItemInfo function
        const result = await userscript.getItemInfo(mockFetch, mockWindowGlobalData, mockWindowGlobalData.pathname, 'saved_media_key');

        expect(mockFetch).toHaveBeenCalled();
        const requestBody = mockFetch.mock.calls[0][1].body;
        expect(requestBody).toContain('VrseUb'); // Ensure correct rpcid
        expect(result.success).toBe(true);
        expect(result.data.savedToYourPhotos).toBe(true);
    });

    it('should get item info correctly for an UNSAVED item', async () => {
        // Mock data for an UNSAVED item, missing the key in the final object
        const mockUnsavedItemData = [
            [
                "unsaved_media_key", null, null, null, null, null, null, null, null,
                { "15": 275865 }
            ]
        ];
        mockFetch.mockResolvedValueOnce(createMockApiResponse('VrseUb', mockUnsavedItemData));

        // Call the simplified getItemInfo function
        const result = await userscript.getItemInfo(mockFetch, mockWindowGlobalData, mockWindowGlobalData.pathname, 'unsaved_media_key');

        expect(mockFetch).toHaveBeenCalled();
        const requestBody = mockFetch.mock.calls[0][1].body;
        expect(requestBody).toContain('VrseUb'); // Ensure correct rpcid
        expect(result.success).toBe(true);
        expect(result.data.savedToYourPhotos).toBe(false);
    });


    it('should handle errors when getting item info', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Network error'));
        const result = await userscript.getItemInfo(mockFetch, mockWindowGlobalData, mockWindowGlobalData.pathname, 'photo_1');
        expect(result.success).toBe(false);
        expect(result.error).toBe('Network error');
    });

    it('should correctly identify saved status using the correct key', async () => {
        // This test uses the exact JSON data captured from the browser console.
        const mockSavedItemData = [
          [ "AF1QipPeppd0W-oLGHs9BFrucRcmjpzBEFpdWrfcKLeP", [ "https://photos.fife.usercontent.google.com/pw/AP1GczOjsojNoGHndFUbCQZ2Vk-QsFFfDbQBNhPKMHzU9wG4NSYID-weSNPYPw", 3264, 2448, null, null, null, null, null, [ 3264, 2448, 1, null, [ "Google", "Pixel 4a (5G)", null, 2.57, 2, 433, 0.019988, null, 1 ] ], [ 11443334 ], 2, [ [ true, true ] ] ], 1755890376618, "AdoJbsdJ2XfeVyvHqojNONStte0", 10800000, 1756329027020, [ "AF1QipPJypJ3NKuo2T87JcLDnOudz4gG" ], [ [ 2 ], [ 31, false, true ], [ 36, false, true ], [ 8 ], [ 21 ], [ 19 ], [ 22 ] ], 2, { "15": 275865, "163238866": [ false, "AdoJbsdJ2XfeVyvHqojNONStte0" ], "525000000": [ [ 3 ] ], "525000002": [ [ "AF1QipNkIwypdOJFqOJBBdZLG8YLvft2kvdvaPXMU_R_8ZkObhrPIizS-gMlGIdypMJZmw", "AF1QipMUcbNTPku1p3XJbYkeGT3DZbvEDImQLRPlKMEt" ] ] } ], "https://photos.fife.usercontent.google.com/pw/AP1GczOjsojNoGHndFUbCQZ2Vk-QsFFfDbQBNhPKMHzU9wG4NSYID-weSNPYPw=s0-d-ip", [ [ 2 ], [ 31, false, true ], [ 36, false, true ], [ 8 ], [ 21 ], [ 19 ], [ 22 ] ], [ "AF1QipPJypJ3NKuo2T87JcLDnOudz4gG", "112324414726690116755", null, null, null, [ "AF1QipPJypJ3NKuo2T87JcLDnOudz4gG", "112324414726690116755" ], null, null, null, null, null, [ "Muhammad Sherbeeny", 1, null, "Muhammad" ], [ "https://lh3.googleusercontent.com/a/ACg8ocKwvOKVL78fg5Xs0usFNz0aKkTyiefq53Xrx3tNxfM_zc-FNbA" ], null, null, null, null, [ 2 ] ], null, null, null, null, null, null, "", null, "https://photos.fife.usercontent.google.com/pw/AP1GczNcs2azqIhDRKK1sYgu1OPbaDuJu7trY23gfDfbHsxXbvi-xiWaE6o_t3hLiT1psglR2TzlZ8YK7uUOdX_sLQjwW0cXGOw"
        ];

        const mockUnsavedItemData = [
          [ "AF1QipMObTO4ZcFTvON4zNK2OqkAl1Yhgkx7QFhyGQDd", [ "https://photos.fife.usercontent.google.com/pw/AP1GczNdWV2d7zBWQX9ZoqNAIV1wk2RyQBbzqzLLOiNjEofCiGedjM6GSzMYFg", 1080, 1913, null, null, null, null, null, [ 1080, 1913, 3 ], [ 3092529 ] ], 1755994085000, "OsLbV2wbkEBTd81Q4b6DabSkuTg", 10800000, 1756329027020, [ "AF1QipPJypJ3NKuo2T87JcLDnOudz4gG" ], [ [ 2 ], [ 31, false, true ], [ 36, false, true ], [ 8 ], [ 21 ], [ 20 ], [ 19 ], [ 22 ] ], 2, { "15": 275865, "525000000": [ [ 1 ] ], "525000002": [ [ "AF1QipNkIwypdOJFqOJBBdZLG8YLvft2kvdvaPXMU_R_8ZkObhrPIizS-gMlGIdypMJZmw", "AF1QipMUcbNTPku1p3XJbYkeGT3DZbvEDImQLRPlKMEt" ] ] } ], "https://photos.fife.usercontent.google.com/pw/AP1GczNdWV2d7zBWQX9ZoqNAIV1wk2RyQBbzqzLLOiNjEofCiGedjM6GSzMYFg=s0-d-ip", [ [ 2 ], [ 31, false, true ], [ 36, false, true ], [ 8 ], [ 21 ], [ 20 ], [ 19 ], [ 22 ] ], [ "AF1QipPJypJ3NKuo2T87JcLDnOudz4gG", "112324414726690116755", null, null, null, [ "AF1QipPJypJ3NKuo2T87JcLDnOudz4gG", "112324414726690116755" ], null, null, null, null, null, [ "Muhammad Sherbeeny", 1, null, "Muhammad" ], [ "https://lh3.googleusercontent.com/a/ACg8ocKwvOKVL78fg5Xs0usFNz0aKkTyiefq53Xrx3tNxfM_zc-FNbA" ], null, null, null, null, [ 2 ] ], null, null, null, null, null, null, "", null, "https://photos.fife.usercontent.google.com/pw/AP1GczN-Zb2Sw25DjoHWMRGTy3QYtM1HIntPGhdvjGO1oDRUhcy9K7Ko5K7Nnp9xySeoNemgtJJgmY5YvMGRi55Nq8km86ATzsU"
        ];


        mockFetch
            .mockResolvedValueOnce(createMockApiResponse('VrseUb', mockSavedItemData))
            .mockResolvedValueOnce(createMockApiResponse('VrseUb', mockUnsavedItemData));

        // Test saved item. This will fail because the current logic is wrong.
        const savedResult = await userscript.getItemInfo(mockFetch, mockWindowGlobalData, mockWindowGlobalData.pathname, 'saved_media_key');
        expect(savedResult.data.savedToYourPhotos).toBe(true);

        // Test unsaved item
        const unsavedResult = await userscript.getItemInfo(mockFetch, mockWindowGlobalData, mockWindowGlobalData.pathname, 'unsaved_media_key');
        expect(unsavedResult.data.savedToYourPhotos).toBe(false);
    });

    it('should add items to a shared album', async () => {
        const mockResponseData = null; // This is what a successful response looks like
        mockFetch.mockResolvedValueOnce(createMockApiResponse('laUYf', mockResponseData));
        const log = jest.fn();

        const result = await userscript.addItemsToSharedAlbum(mockFetch, mockWindowGlobalData, mockWindowGlobalData.pathname, ['photo_1'], 'album_id_2', log);

        expect(mockFetch).toHaveBeenCalled();
        const requestBody = mockFetch.mock.calls[0][1].body;
        expect(requestBody).toContain('photo_1');
        expect(requestBody).toContain('album_id_2');
        expect(result).toEqual(mockResponseData); // Check that the raw response is returned
    });

    it('should add items to a non-shared album', async () => {
        const mockResponseData = [1]; // This is what a successful response looks like
        mockFetch.mockResolvedValueOnce(createMockApiResponse('E1Cajb', mockResponseData));
        const log = jest.fn();

        const result = await userscript.addItemsToNonSharedAlbum(mockFetch, mockWindowGlobalData, mockWindowGlobalData.pathname, ['photo_1'], 'album_id_2', log);

        expect(mockFetch).toHaveBeenCalled();
        const requestBody = mockFetch.mock.calls[0][1].body;
        expect(requestBody).toContain('photo_1');
        expect(requestBody).toContain('album_id_2');
        expect(result).toEqual(mockResponseData); // Check that the raw response is returned
    });

    it('should handle errors when adding items to an album', async () => {
        // Now that the function doesn't have a try/catch, we expect it to throw.
        // The calling function `startProcessing` is responsible for catching errors.
        mockFetch.mockRejectedValueOnce(new Error('Network error'));
        const log = jest.fn();
        await expect(
            userscript.addItemsToSharedAlbum(mockFetch, mockWindowGlobalData, mockWindowGlobalData.pathname, ['photo_1'], 'album_id_2', log)
        ).rejects.toThrow('Network error');
    });

    // --- Testing the main processing function ---
    it('should execute the full processing logic, finding unsaved items', async () => {
        const log = jest.fn();
        const getUiState = () => ({
            selectedAlbums: [
                { mediaKey: 'album_id_1', isShared: true, title: 'Test Album' }
            ],
            filter: 'not-saved',
            destinationAlbum: { mediaKey: 'album_id_dest', isShared: false },
        });

        // --- Mock API Responses ---
        const albumPage = [null, [['photo_unsaved'], ['photo_saved']]];

        // UNSAVED item mock data (missing the key)
        const itemInfoUnsaved = [[ "photo_unsaved", null, null, null, null, null, null, null, null, { "15": 123 } ]];
        // SAVED item mock data (has the key)
        const itemInfoSaved = [[ "photo_saved", null, null, null, null, null, null, null, null, { "15": 123, "163238866": [] } ]];

        mockFetch
            // --- Get Album Page ---
            .mockResolvedValueOnce(createMockApiResponse('snAcKc', albumPage))
            // --- GetItemInfo calls (now always VrseUb) ---
            .mockResolvedValueOnce(createMockApiResponse('VrseUb', itemInfoUnsaved)) // for photo_unsaved
            .mockResolvedValueOnce(createMockApiResponse('VrseUb', itemInfoSaved))   // for photo_saved
            // --- Final Add Call ---
            .mockResolvedValueOnce(createMockApiResponse('E1Cajb', [1])); // addItemsToNonSharedAlbum

        await userscript.startProcessing(mockFetch, mockWindowGlobalData, mockWindowGlobalData.pathname, log, getUiState);

        // Check logs for correct flow
        expect(log).toHaveBeenCalledWith('Fetching media items from album: Test Album...');
        expect(log).toHaveBeenCalledWith('Found 2 items in album. Checking their status...');
        expect(log).toHaveBeenCalledWith('Scanned 2 total items across all selected albums.');
        expect(log).toHaveBeenCalledWith('Found 1 matching items.');
        expect(log).toHaveBeenCalledWith('Adding 1 items to destination album...');
        // Updated expectation for the diagnostic logging
        expect(log).toHaveBeenCalledWith(`API Response for batch 1: ${JSON.stringify([1], null, 2)}`);
        expect(log).toHaveBeenCalledWith('Finished adding all batches.');


        // Verify that only VrseUb was used for getItemInfo
        const getItemInfoCalls = mockFetch.mock.calls.filter(call => call[0].includes('batchexecute?rpcids=VrseUb'));
        expect(getItemInfoCalls.length).toBe(2);

        // Verify the final API call to add items
        const lastFetchCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
        const requestBody = lastFetchCall[1].body;
        expect(requestBody).toContain('E1Cajb');
        expect(requestBody).toContain('photo_unsaved');
        expect(requestBody).not.toContain('photo_saved');
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

        // The error is now caught inside startProcessing and logged
        expect(log).toHaveBeenCalledWith('Error getting item info: API returned null or undefined response for item photo_1. rpcid: VrseUb. Response: null');
    });


    it('should handle empty selected albums in processing', async () => {
        const log = jest.fn();
        const getUiState = () => ({
            selectedAlbums: [],
            filter: 'not-saved',
            destinationAlbum: 'album_id_2', // Corrected key
        });

        await userscript.startProcessing(mockFetch, mockWindowGlobalData, mockWindowGlobalData.pathname, log, getUiState);

        expect(log).toHaveBeenCalledWith('No source albums selected.');
    });

    it('should handle empty destination album in processing', async () => {
        const log = jest.fn();
        const getUiState = () => ({
            selectedAlbums: [{ mediaKey: 'album_id_1' }], // Corrected object
            filter: 'not-saved',
            destinationAlbum: null, // Corrected key
        });

        await userscript.startProcessing(mockFetch, mockWindowGlobalData, mockWindowGlobalData.pathname, log, getUiState);

        expect(log).toHaveBeenCalledWith('No destination album selected.');
    });

    it('should log the raw response when adding items returns something unexpected', async () => {
        const log = jest.fn();
        const getUiState = () => ({
            selectedAlbums: [{ mediaKey: 'album_id_1', isShared: false, title: 'Test Album' }],
            filter: 'not-saved',
            destinationAlbum: { mediaKey: 'album_id_2', isShared: true },
        });

        // Mock the sequence of fetch calls
        const albumPageData = [null, [['photo_1_unsaved']]];
        const itemInfoUnsaved = [[ "photo_1_unsaved", null, null, null, null, null, null, null, null, {} ]];
        const unexpectedApiResponse = { "error": "something went wrong" }; // Unexpected response

        mockFetch
            .mockResolvedValueOnce(createMockApiResponse('snAcKc', albumPageData)) // getAlbumPage
            .mockResolvedValueOnce(createMockApiResponse('VrseUb', itemInfoUnsaved)) // getItemInfo for photo 1
            .mockResolvedValueOnce(createMockApiResponse('laUYf', unexpectedApiResponse)); // addItemsToSharedAlbum -> UNEXPECTED

        await userscript.startProcessing(mockFetch, mockWindowGlobalData, mockWindowGlobalData.pathname, log, getUiState);

        // Check logs
        expect(log).toHaveBeenCalledWith('Adding 1 items to destination album...');
        expect(log).toHaveBeenCalledWith(`API Response for batch 1: ${JSON.stringify(unexpectedApiResponse, null, 2)}`);
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

        it('itemInfoParse should correctly identify a saved item', () => {
            const mockSavedItemData = [
                [ "item_id_saved", null, null, null, null, null, null, null, null, { "163238866": [] } ]
            ];
            const parsed = userscript.itemInfoParse(mockSavedItemData);
            expect(parsed.savedToYourPhotos).toBe(true);
        });

        it('itemInfoParse should correctly identify an unsaved item', () => {
            const mockUnsavedItemData = [
                [ "item_id_unsaved", null, null, null, null, null, null, null, null, {} ]
            ];
            const parsed = userscript.itemInfoParse(mockUnsavedItemData);
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
        const mockUnsavedItemData = (i) => [[ `photo_${i}`, null, null, null, null, null, null, null, null, {} ]];

        // Mock the API calls
        mockFetch.mockResolvedValueOnce(createMockApiResponse('snAcKc', [null, mockItems])); // getAlbumPage
        for (let i = 0; i < 75; i++) {
            // Mocking all items as unsaved
            mockFetch.mockResolvedValueOnce(createMockApiResponse('VrseUb', mockUnsavedItemData(i)));
        }
        // Mock the two batch addition calls
        mockFetch.mockResolvedValueOnce(createMockApiResponse('laUYf', null)); // addItemsToSharedAlbum batch 1
        mockFetch.mockResolvedValueOnce(createMockApiResponse('laUYf', null)); // addItemsToSharedAlbum batch 2

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
