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

        it('should correctly identify a SAVED item by searching backwards for the metadata object', () => {
            const mockSavedItemData = [
                [
                    "mediaKey_1", null, null, null, null, [], // variable non-object elements
                    { "163238866": [] }, // The metadata object
                    "some_other_string" // another non-object element
                ]
            ];
            const parsed = userscript.itemInfoParse(mockSavedItemData);
            expect(parsed.savedToYourPhotos).toBe(true);
        });


        it('should correctly identify an UNSAVED item', () => {
            const mockUnsavedItemData = [
                [
                    "mediaKey_2", null, null, null, null, null, null, null,
                    { "15": 123 },
                    { "15": 123 }
                ]
            ];
            const parsed = userscript.itemInfoParse(mockUnsavedItemData);
            expect(parsed.savedToYourPhotos).toBe(false);
        });
    });


    // --- Testing the Main Processing Function with Nuanced Success Logic ---

    it('should log SUCCESS for NON-SHARED album add when response IS an array', async () => {
        const log = jest.fn();
        const getUiState = () => ({
            selectedAlbums: [{ mediaKey: 'album_id_1', isShared: false, title: 'Test Album' }],
            filter: 'not-saved',
            destinationAlbum: { mediaKey: 'album_id_dest', isShared: false, title: 'Dest Album' },
        });

        const albumPage = [null, [['photo_unsaved']]];
        const itemInfoUnsaved = [["photo_unsaved", null, null, null, null, null, null, null, { "15": 123 }]];

        mockFetch
            .mockResolvedValueOnce(createMockApiResponse('snAcKc', albumPage))
            .mockResolvedValueOnce(createMockApiResponse('VrseUb', itemInfoUnsaved))
            .mockResolvedValueOnce(createMockApiResponse('E1Cajb', [1])); // Array response IS success

        await userscript.startProcessing(mockFetch, mockWindowGlobalData, mockWindowGlobalData.pathname, log, getUiState);

        expect(log).toHaveBeenCalledWith('Batch 1 added successfully.');
    });

    it('should log ERROR for NON-SHARED album add when response is NOT an array', async () => {
        const log = jest.fn();
        const getUiState = () => ({
            selectedAlbums: [{ mediaKey: 'album_id_1', isShared: false, title: 'Test Album' }],
            filter: 'not-saved',
            destinationAlbum: { mediaKey: 'album_id_dest', isShared: false, title: 'Dest Album' },
        });

        const albumPage = [null, [['photo_unsaved']]];
        const itemInfoUnsaved = [["photo_unsaved", null, null, null, null, null, null, null, { "15": 123 }]];
        const errorResponse = { "error": "failed" }; // Not an array

        mockFetch
            .mockResolvedValueOnce(createMockApiResponse('snAcKc', albumPage))
            .mockResolvedValueOnce(createMockApiResponse('VrseUb', itemInfoUnsaved))
            .mockResolvedValueOnce(createMockApiResponse('E1Cajb', errorResponse));

        await userscript.startProcessing(mockFetch, mockWindowGlobalData, mockWindowGlobalData.pathname, log, getUiState);

        expect(log).toHaveBeenCalledWith(`Error adding batch 1. Unexpected API Response: ${JSON.stringify(errorResponse, null, 2)}`);
    });

    it('should log SUCCESS for SHARED album add when response IS null', async () => {
        const log = jest.fn();
        const getUiState = () => ({
            selectedAlbums: [{ mediaKey: 'album_id_1', isShared: true, title: 'Test Shared Album' }],
            filter: 'not-saved',
            destinationAlbum: { mediaKey: 'album_id_dest', isShared: true, title: 'Dest Shared' },
        });

        const albumPage = [null, [['photo_unsaved']]];
        const itemInfoUnsaved = [["photo_unsaved", null, null, null, null, null, null, null, { "15": 123 }]];

        mockFetch
            .mockResolvedValueOnce(createMockApiResponse('snAcKc', albumPage))
            .mockResolvedValueOnce(createMockApiResponse('VrseUb', itemInfoUnsaved))
            .mockResolvedValueOnce(createMockApiResponse('laUYf', null)); // Null response IS success

        await userscript.startProcessing(mockFetch, mockWindowGlobalData, mockWindowGlobalData.pathname, log, getUiState);

        expect(log).toHaveBeenCalledWith('Batch 1 added successfully.');
    });

    it('should log ERROR for SHARED album add when response is NOT null', async () => {
        const log = jest.fn();
        const getUiState = () => ({
            selectedAlbums: [{ mediaKey: 'album_id_1', isShared: true, title: 'Test Shared Album' }],
            filter: 'not-saved',
            destinationAlbum: { mediaKey: 'album_id_dest', isShared: true, title: 'Dest Shared' },
        });

        const albumPage = [null, [['photo_unsaved']]];
        const itemInfoUnsaved = [["photo_unsaved", null, null, null, null, null, null, null, { "15": 123 }]];
        const errorResponse = { "error": "not null" }; // A non-null response is an error

        mockFetch
            .mockResolvedValueOnce(createMockApiResponse('snAcKc', albumPage))
            .mockResolvedValueOnce(createMockApiResponse('VrseUb', itemInfoUnsaved))
            .mockResolvedValueOnce(createMockApiResponse('laUYf', errorResponse));

        await userscript.startProcessing(mockFetch, mockWindowGlobalData, mockWindowGlobalData.pathname, log, getUiState);

        expect(log).toHaveBeenCalledWith(`Error adding batch 1. Unexpected API Response: ${JSON.stringify(errorResponse, null, 2)}`);
    });

});
