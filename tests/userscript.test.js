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

    // --- Testing Parsers with new robust logic ---
    describe('itemInfoParse (Robust Detection)', () => {

        it('should correctly identify a SAVED item (key at index 8)', () => {
            const mockSavedItemData = [
                [
                    "mediaKey_1", null, null, null, null, null, null, null,
                    { "163238866": [] } // Key at index 8
                ]
            ];
            const parsed = userscript.itemInfoParse(mockSavedItemData);
            expect(parsed.savedToYourPhotos).toBe(true);
        });

        it('should correctly identify a SAVED item (key at index 9)', () => {
            const mockSavedItemData = [
                [
                    "mediaKey_1", null, null, null, null, null, null, null, null,
                    { "163238866": [] } // Key at index 9
                ]
            ];
            const parsed = userscript.itemInfoParse(mockSavedItemData);
            expect(parsed.savedToYourPhotos).toBe(true);
        });

        it('should correctly identify a SAVED item (key at index 15)', () => {
            const mockSavedItemData = [
                [
                    "mediaKey_1", null, null, null, null, null, null, null, null, null, null, null, null, null, null,
                    { "163238866": [] } // Key at index 15
                ]
            ];
            const parsed = userscript.itemInfoParse(mockSavedItemData);
            expect(parsed.savedToYourPhotos).toBe(true);
        });

        it('should correctly identify an UNSAVED item', () => {
            const mockUnsavedItemData = [
                [
                    "mediaKey_2", null, null, null, null, null, null, null,
                    { "15": 123 }, // No key at 8
                    { "15": 123 }  // No key at 9
                ]
            ];
            const parsed = userscript.itemInfoParse(mockUnsavedItemData);
            expect(parsed.savedToYourPhotos).toBe(false);
        });
    });


    // --- Testing the Main Processing Function ---

    it('should execute full logic and log success on NON-SHARED album add', async () => {
        const log = jest.fn();
        const getUiState = () => ({
            selectedAlbums: [{ mediaKey: 'album_id_1', isShared: false, title: 'Test Album' }],
            filter: 'not-saved',
            destinationAlbum: { mediaKey: 'album_id_dest', isShared: false, title: 'Dest Album' },
        });

        const albumPage = [null, [
            ['photo_unsaved'],
            ['photo_saved']
        ]];
        const itemInfoSaved = [
            ["photo_saved", null, null, null, null, null, null, null, { "163238866": [] }]
        ];
        const itemInfoUnsaved = [
            ["photo_unsaved", null, null, null, null, null, null, null, { "15": 123 }]
        ];

        mockFetch
            .mockResolvedValueOnce(createMockApiResponse('snAcKc', albumPage))
            .mockResolvedValueOnce(createMockApiResponse('VrseUb', itemInfoUnsaved))
            .mockResolvedValueOnce(createMockApiResponse('VrseUb', itemInfoSaved))
            .mockResolvedValueOnce(createMockApiResponse('E1Cajb', [1])); // Array response is success

        await userscript.startProcessing(mockFetch, mockWindowGlobalData, mockWindowGlobalData.pathname, log, getUiState);

        expect(log).toHaveBeenCalledWith('--- Processing Album: Test Album ---');
        expect(log).toHaveBeenCalledWith('Found 1 matching items in this album.');
        expect(log).toHaveBeenCalledWith('Found matching item: photo_unsaved'); // Verbose logging
        expect(log).toHaveBeenCalledWith('Adding batch 1 of 1 items...');
        expect(log).toHaveBeenCalledWith('Batch 1 added successfully.');
    });

    it('should log an error when adding to a SHARED album fails (gets non-array response)', async () => {
        const log = jest.fn();
        const getUiState = () => ({
            selectedAlbums: [{ mediaKey: 'album_id_shared', isShared: true, title: 'Shared Test' }],
            filter: 'not-saved',
            destinationAlbum: { mediaKey: 'album_id_dest_shared', isShared: true, title: 'Dest Shared' },
        });

        const albumPageData = [null, [['photo_1_unsaved']]];
        const itemInfoUnsaved = [["photo_1_unsaved", null, null, null, null, null, null, null, {}]];
        const unexpectedApiResponse = null; // Not an array, so it's an error

        mockFetch
            .mockResolvedValueOnce(createMockApiResponse('snAcKc', albumPageData))
            .mockResolvedValueOnce(createMockApiResponse('VrseUb', itemInfoUnsaved))
            .mockResolvedValueOnce(createMockApiResponse('laUYf', unexpectedApiResponse));

        await userscript.startProcessing(mockFetch, mockWindowGlobalData, mockWindowGlobalData.pathname, log, getUiState);

        expect(log).toHaveBeenCalledWith('Adding batch 1 of 1 items...');
        expect(log).toHaveBeenCalledWith(`Error adding batch 1. Unexpected API Response: ${JSON.stringify(unexpectedApiResponse, null, 2)}`);
    });
});
