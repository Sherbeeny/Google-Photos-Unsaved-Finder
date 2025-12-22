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
        const mockAlbumData = [
            [
                ["album_id_1", ["thumbnail_url_1"], null, null, null, null, [
                    ["owner_id_1"]
                ], { "72930366": [null, "Test Album 1", null, 123, true] }]
            ]
        ];
        mockFetch.mockResolvedValueOnce(createMockApiResponse('Z5xsfc', mockAlbumData));

        const result = await userscript.getAlbums(mockFetch, mockWindowGlobalData, mockWindowGlobalData.pathname);

        expect(mockFetch).toHaveBeenCalled();
        expect(result.success).toBe(true);
        expect(result.data.length).toBe(1);
        expect(result.data[0].title).toBe('Test Album 1');
    });

    it('should fetch an album page correctly', async () => {
        const mockAlbumPageData = [null, [
            ['photo_1']
        ]];
        mockFetch.mockResolvedValueOnce(createMockApiResponse('snAcKc', mockAlbumPageData));

        const result = await userscript.getAlbumPage(mockFetch, mockWindowGlobalData, mockWindowGlobalData.pathname, 'album_id_1');

        expect(mockFetch).toHaveBeenCalled();
        expect(result.success).toBe(true);
        expect(result.data.items.length).toBe(1);
        expect(result.data.items[0].mediaKey).toBe('photo_1');
    });


    // --- Testing Parsers with new definitive logic ---
    describe('Parsers', () => {

        it('itemInfoParse should correctly identify a SAVED item', () => {
            const mockSavedItemData = [
                [ // Outer array
                    "AF1QipPeppd0W-oLGHs9BFrucRcmjpzBEFpdWrfcKLeP", // mediaKey at [0][0]
                    [], // some data
                    1755890376618,
                    "AdoJbsdJ2XfeVyvHqojNONStte0",
                    10800000,
                    1756329027020,
                    [],
                    [],
                    2, {
                        "15": 275865,
                        "163238866": [false, "AdoJbsdJ2XfeVyvHqojNONStte0"] // The definitive key
                    } // The info object at [0][9]
                ]
            ];
            const parsed = userscript.itemInfoParse(mockSavedItemData);
            expect(parsed.savedToYourPhotos).toBe(true);
        });

        it('itemInfoParse should correctly identify an UNSAVED item', () => {
            const mockUnsavedItemData = [
                [ // Outer array
                    "AF1QipMObTO4ZcFTvON4zNK2OqkAl1Yhgkx7QFhyGQDd", // mediaKey at [0][0]
                    [],
                    1755994085000,
                    "OsLbV2wbkEBTd81Q4b6DabSkuTg",
                    10800000,
                    1756329027020,
                    [],
                    [],
                    2, {
                        "15": 275865,
                        // "163238866" is missing
                    } // The info object at [0][9]
                ]
            ];
            const parsed = userscript.itemInfoParse(mockUnsavedItemData);
            expect(parsed.savedToYourPhotos).toBe(false);
        });
    });


    // --- Testing "Add to Album" Functions ---

    it('should add items to a SHARED album with the correct request format', async () => {
        const mockResponseData = null; // A null response is a success for shared albums
        mockFetch.mockResolvedValueOnce(createMockApiResponse('laUYf', mockResponseData));

        const result = await userscript.addItemsToSharedAlbum(mockFetch, mockWindowGlobalData, mockWindowGlobalData.pathname, ['photo_1'], 'album_id_shared');

        expect(mockFetch).toHaveBeenCalled();
        const requestBody = decodeURIComponent(mockFetch.mock.calls[0][1].body);
        expect(requestBody).toContain('"laUYf"');
        expect(requestBody).toContain('photo_1');
        expect(requestBody).toContain('album_id_shared');
        expect(result).toEqual(mockResponseData);
    });

    it('should add items to a NON-SHARED album', async () => {
        const mockResponseData = [1]; // An array response is a success for non-shared
        mockFetch.mockResolvedValueOnce(createMockApiResponse('E1Cajb', mockResponseData));

        const result = await userscript.addItemsToNonSharedAlbum(mockFetch, mockWindowGlobalData, mockWindowGlobalData.pathname, ['photo_1'], 'album_id_non_shared');

        expect(mockFetch).toHaveBeenCalled();
        const requestBody = decodeURIComponent(mockFetch.mock.calls[0][1].body);
        expect(requestBody).toContain('"E1Cajb"');
        expect(requestBody).toContain('photo_1');
        expect(requestBody).toContain('album_id_non_shared');
        expect(result).toEqual(mockResponseData);
    });


    // --- Testing the Main Processing Function ---

    it('should execute the full logic for one album, find unsaved items, and log success on add', async () => {
        const log = jest.fn();
        const getUiState = () => ({
            selectedAlbums: [{ mediaKey: 'album_id_1', isShared: true, title: 'Test Shared Album' }],
            filter: 'not-saved',
            destinationAlbum: { mediaKey: 'album_id_dest', isShared: true, title: 'Destination Album' },
        });

        // --- Mock API Responses ---
        const albumPage = [null, [
            ['photo_unsaved'],
            ['photo_saved']
        ]];

        // SAVED: has the '163238866' key
        const itemInfoSaved = [
            ["photo_saved", [], 1, "dedup1", 1, 1, [], [], 2, { "163238866": [] }]
        ];
        // UNSAVED: missing the '163238866' key
        const itemInfoUnsaved = [
            ["photo_unsaved", [], 1, "dedup2", 1, 1, [], [], 2, { "15": 123 }]
        ];

        mockFetch
            // 1. Get Album Page
            .mockResolvedValueOnce(createMockApiResponse('snAcKc', albumPage))
            // 2. GetItemInfo calls for the two items (Corrected: response is not double-wrapped)
            .mockResolvedValueOnce(createMockApiResponse('VrseUb', itemInfoUnsaved))
            .mockResolvedValueOnce(createMockApiResponse('VrseUb', itemInfoSaved))
            // 3. Final Add Call (to a shared album, so null is success)
            .mockResolvedValueOnce(createMockApiResponse('laUYf', null));

        await userscript.startProcessing(mockFetch, mockWindowGlobalData, mockWindowGlobalData.pathname, log, getUiState);

        // Check logs for correct flow
        expect(log).toHaveBeenCalledWith('--- Processing Album: Test Shared Album ---');
        expect(log).toHaveBeenCalledWith('Found 2 total items in album.');
        expect(log).toHaveBeenCalledWith('Checking status of each item...');
        expect(log).toHaveBeenCalledWith('Found 1 matching items in this album.');
        expect(log).toHaveBeenCalledWith('Adding 1 items to destination album: Destination Album...');
        expect(log).toHaveBeenCalledWith('Adding batch 1 of 1 items...');
        expect(log).toHaveBeenCalledWith('Batch 1 added successfully.'); // <-- Verifies the new success logic
        expect(log).toHaveBeenCalledWith('--- Summary ---');
        expect(log).toHaveBeenCalledWith('Scanned 2 total items across all selected albums.');
        expect(log).toHaveBeenCalledWith('Found 1 total matching items.');
        expect(log).toHaveBeenCalledWith('Processing complete.');

        // Verify the final API call to add items
        const lastFetchCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
        const requestBody = decodeURIComponent(lastFetchCall[1].body);
        expect(requestBody).toContain('"laUYf"');
        expect(requestBody).toContain('photo_unsaved');
        expect(requestBody).not.toContain('photo_saved');
    });

     it('should log an error when adding to a non-shared album fails', async () => {
        const log = jest.fn();
        const getUiState = () => ({
            selectedAlbums: [{ mediaKey: 'album_id_1', isShared: false, title: 'Test Album' }],
            filter: 'not-saved',
            destinationAlbum: { mediaKey: 'album_id_dest', isShared: false, title: 'Dest Album' },
        });

        const albumPageData = [null, [['photo_1_unsaved']]];
        const itemInfoUnsaved = [["photo_1_unsaved", [], 1, "d", 1, 1, [], [], 2, {}]];
        const unexpectedApiResponse = { "error": "something went wrong" }; // Not an array, so it's an error

        mockFetch
            .mockResolvedValueOnce(createMockApiResponse('snAcKc', albumPageData))
            .mockResolvedValueOnce(createMockApiResponse('VrseUb', itemInfoUnsaved))
            .mockResolvedValueOnce(createMockApiResponse('E1Cajb', unexpectedApiResponse));

        await userscript.startProcessing(mockFetch, mockWindowGlobalData, mockWindowGlobalData.pathname, log, getUiState);

        // Check logs
        expect(log).toHaveBeenCalledWith('Adding batch 1 of 1 items...');
        expect(log).toHaveBeenCalledWith(`Error adding batch 1. Unexpected API Response: ${JSON.stringify(unexpectedApiResponse, null, 2)}`);
    });
});
