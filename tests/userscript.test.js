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
        const mockAlbumData = [[["album_id_1", ["thumbnail_url_1"], null, null, null, null, ["owner_id_1"], {"72930366":[null,"Test Album 1",null,123,false]}]]];
        mockFetch.mockResolvedValueOnce(createMockApiResponse('Z5xsfc', mockAlbumData));

        const albums = await userscript.getAlbums(mockFetch, mockWindowGlobalData);

        expect(mockFetch).toHaveBeenCalled();
        expect(albums).toBeDefined();
        expect(albums.length).toBe(1);
        expect(albums[0].title).toBe('Test Album 1');
    });

    it('should handle errors when fetching albums', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Network error'));
        await expect(userscript.getAlbums(mockFetch, mockWindowGlobalData)).rejects.toThrow('Network error');
    });

    it('should fetch an album page correctly', async () => {
        const mockAlbumPageData = [null, [['photo_1']]];
        mockFetch.mockResolvedValueOnce(createMockApiResponse('snAcKc', mockAlbumPageData));

        const page = await userscript.getAlbumPage(mockFetch, mockWindowGlobalData, 'album_id_1');

        expect(mockFetch).toHaveBeenCalled();
        expect(page).toBeDefined();
        expect(page.items.length).toBe(1);
        expect(page.items[0].mediaKey).toBe('photo_1');
    });

    it('should handle errors when fetching an album page', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Network error'));
        await expect(userscript.getAlbumPage(mockFetch, mockWindowGlobalData, 'album_id_1')).rejects.toThrow('Network error');
    });

    it('should get item info correctly', async () => {
        // Corrected mock data: removed extra array nesting
        const mockItemInfoData = [ ['photo_1', null, null, null, null, null, null, null, null, null, null, null, null, null, null, {'163238866': [true]}] ];
        mockFetch.mockResolvedValueOnce(createMockApiResponse('VrseUb', mockItemInfoData));

        const info = await userscript.getItemInfo(mockFetch, mockWindowGlobalData, 'photo_1');

        expect(mockFetch).toHaveBeenCalled();
        expect(info).toBeDefined();
        expect(info.savedToYourPhotos).toBe(true);
    });

    it('should handle errors when getting item info', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Network error'));
        await expect(userscript.getItemInfo(mockFetch, mockWindowGlobalData, 'photo_1')).rejects.toThrow('Network error');
    });

    it('should add items to a shared album', async () => {
        mockFetch.mockResolvedValueOnce(createMockApiResponse('laUYf', []));

        await userscript.addItemsToSharedAlbum(mockFetch, mockWindowGlobalData, ['photo_1'], 'album_id_2');

        expect(mockFetch).toHaveBeenCalled();
        const requestBody = mockFetch.mock.calls[0][1].body;
        expect(requestBody).toContain('photo_1');
        expect(requestBody).toContain('album_id_2');
    });

    it('should handle errors when adding items to a shared album', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Network error'));
        await expect(userscript.addItemsToSharedAlbum(mockFetch, mockWindowGlobalData, ['photo_1'], 'album_id_2')).rejects.toThrow('Network error');
    });

    // --- Testing the main processing function ---
    it('should execute the full processing logic', async () => {
        const log = jest.fn();
        const getUiState = () => ({
            selectedAlbums: ['album_id_1'],
            filter: 'not-saved',
            destination: 'album_id_2',
        });

        // Mock the sequence of fetch calls
        const albumPageData = [null, [['photo_1_unsaved'], ['photo_2_saved']]];
        // Corrected mock data: removed extra array nesting
        const itemInfoUnsaved = [ ['photo_1_unsaved', null, null, null, null, null, null, null, null, null, null, null, null, null, null, {'163238866': []}] ];
        const itemInfoSaved = [ ['photo_2_saved', null, null, null, null, null, null, null, null, null, null, null, null, null, null, {'163238866': [true]}] ];

        mockFetch
            .mockResolvedValueOnce(createMockApiResponse('snAcKc', albumPageData)) // getAlbumPage
            .mockResolvedValueOnce(createMockApiResponse('VrseUb', itemInfoUnsaved)) // getItemInfo for photo 1
            .mockResolvedValueOnce(createMockApiResponse('VrseUb', itemInfoSaved))   // getItemInfo for photo 2
            .mockResolvedValueOnce(createMockApiResponse('laUYf', [])); // addItemsToSharedAlbum

        await userscript.startProcessing(mockFetch, mockWindowGlobalData, log, getUiState);

        // Check logs
        expect(log).toHaveBeenCalledWith('Starting processing...');
        expect(log).toHaveBeenCalledWith('Found 1 matching items.');
        expect(log).toHaveBeenCalledWith('Adding 1 items to destination album...');

        // Verify the final API call to add items
        const lastFetchCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
        const requestBody = lastFetchCall[1].body;
        expect(requestBody).toContain('laUYf');
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

        await userscript.startProcessing(mockFetch, mockWindowGlobalData, log, getUiState);

        expect(log).toHaveBeenCalledWith('No source albums selected.');
    });

    it('should handle empty destination album in processing', async () => {
        const log = jest.fn();
        const getUiState = () => ({
            selectedAlbums: ['album_id_1'],
            filter: 'not-saved',
            destination: '',
        });

        await userscript.startProcessing(mockFetch, mockWindowGlobalData, log, getUiState);

        expect(log).toHaveBeenCalledWith('No destination album selected.');
    });

    // --- Testing UI Creation (basic) ---
    it('should create the basic UI structure', () => {
        // Mock the getAlbums call that createUI depends on
        const mockAlbumData = [[["album_id_1", ["thumbnail_url_1"], null, null, null, null, ["owner_id_1"], {"72930366":[null,"Test Album 1",null,123,false]}]]];
        global.fetch.mockResolvedValueOnce(createMockApiResponse('Z5xsfc', mockAlbumData));

        // Mock Tampermonkey functions for this test
        global.GM_addStyle = jest.fn();
        global.unsafeWindow = { WIZ_global_data: mockWindowGlobalData };

        userscript.createUI();

        expect(document.querySelector('.gpuf-modal')).not.toBeNull();
        expect(document.querySelector('.gpuf-start-button')).not.toBeNull();
    });
});
