// Mock the global Tampermonkey functions and objects before the script is required.
global.GM_addStyle = jest.fn();
global.GM_registerMenuCommand = jest.fn();
global.GM_info = { script: { version: 'test-version' } };
global.unsafeWindow = {};

// By requiring the script, we allow Jest to instrument it for coverage.
const { createUI, start } = require('../src/google_photos_unsaved_finder.user.js');

describe('UI Creation', () => {
    let ui;

    beforeAll(() => {
        // The createUI function returns a DOM element, which we can inspect.
        ui = createUI();
        document.body.appendChild(ui);
    });

    afterAll(() => {
        document.body.innerHTML = '';
        jest.clearAllMocks();
    });

    test('should create the main modal window with a title', () => {
        // Acceptance criteria: The main container for the UI should exist and have a title.
        const modal = document.querySelector('.gpf-window');
        expect(modal).not.toBeNull();

        const title = modal.querySelector('h2');
        expect(title).not.toBeNull();
        expect(title.textContent).toBe('Google Photos Unsaved Finder');
    });

    test('should contain a section for source albums', () => {
        // Acceptance criteria: A container for the source album checklist should be present.
        const sourceAlbumsSection = document.querySelector('.gpf-section-source-albums');
        expect(sourceAlbumsSection).not.toBeNull();
        expect(sourceAlbumsSection.querySelector('label').textContent).toContain('Source Album');
    });

    test('should contain a section for filter options', () => {
        // Acceptance criteria: A container for the filter radio buttons should be present.
        const filterOptionsSection = document.querySelector('.gpf-section-filters');
        expect(filterOptionsSection).not.toBeNull();
        expect(filterOptionsSection.querySelector('label').textContent).toContain('Filter by');
    });

    test('should contain a batch size input', () => {
        // Acceptance criteria: The UI must have a number input for batch size.
        const batchInput = document.querySelector('input[type="number"].gpf-batch-size-input');
        expect(batchInput).not.toBeNull();
        expect(batchInput.value).toBe('20');
    });

    test('should contain a section for destination album', () => {
        // Acceptance criteria: A container for the destination album controls should be present.
        const destinationAlbumSection = document.querySelector('.gpf-section-destination');
        expect(destinationAlbumSection).not.toBeNull();
        expect(destinationAlbumSection.querySelector('label').textContent).toContain('Destination');
    });

    test('should have a Start and Stop button, with Stop hidden initially', () => {
        // Acceptance criteria: The UI must have "Start" and "Stop" buttons, with correct initial visibility.
        const startButton = document.querySelector('button.gpf-start-button');
        const stopButton = document.querySelector('button.gpf-stop-button');

        expect(startButton).not.toBeNull();
        expect(startButton.textContent).toBe('Start');
        expect(startButton.style.display).not.toBe('none');

        expect(stopButton).not.toBeNull();
        expect(stopButton.textContent).toBe('Stop');
        expect(stopButton.style.display).toBe('none');
    });

    test('should have an X button to close the UI', () => {
        // Acceptance criteria: The UI must have a dedicated close button.
        const closeXButton = document.querySelector('button.gpf-close-x-button');
        expect(closeXButton).not.toBeNull();
        expect(closeXButton.querySelector('svg')).not.toBeNull();
    });

    test('should contain filter radio buttons', () => {
        // Acceptance criteria: The UI must have radio buttons for filtering.
        const filterRadios = document.querySelectorAll('input[type="radio"][name="filter"]');
        expect(filterRadios).toHaveLength(3);
        const filterValues = Array.from(filterRadios).map(r => r.value);
        expect(filterValues).toEqual(expect.arrayContaining(['any', 'saved', 'not-saved']));
    });

    test('should have a feedback area', () => {
        // Acceptance criteria: A dedicated area for logs and status updates must exist.
        const feedbackArea = document.querySelector('.gpf-feedback-area');
        expect(feedbackArea).not.toBeNull();
        expect(feedbackArea.querySelector('.gpf-log-window')).not.toBeNull();
    });
});

describe('UI API Handling', () => {
    beforeEach(() => {
        // Reset the DOM and the mocked API before each test
        document.body.innerHTML = '';
        unsafeWindow.gptkApi = {
            getAlbums: jest.fn(),
            getAlbumPage: jest.fn(),
            getItemInfo: jest.fn(),
        };
    });

    test('should disable the Start button and show an error if gptkApi is not available', () => {
        // Acceptance criteria: If the API is missing, the user is notified and cannot proceed.

        // 1. Setup: Ensure the API is not present.
        unsafeWindow.gptkApi = undefined;

        // 2. Action: Run the script's entry point for the UI.
        start();

        // 3. Assertions: Check the state of the UI.
        const startButton = document.querySelector('button.gpf-start-button');
        expect(startButton.disabled).toBe(true);

        const feedbackArea = document.querySelector('.gpf-feedback-area .gpf-log-window');
        expect(feedbackArea.textContent).toContain('Error: Google Photos Toolkit (GPTK) not found.');
    });

    test('should enable the Start button if gptkApi is available', () => {
        // Acceptance criteria: If the API is present, the user can start the process.
        // 1. Setup: Mock the API's presence, including the functions that will be called.
        unsafeWindow.gptkApi.getAlbums.mockResolvedValue({ items: [] });

        // 2. Action: Run the script's entry point.
        start();

        // 3. Assertions: Check the state of the UI.
        const startButton = document.querySelector('button.gpf-start-button');
        expect(startButton.disabled).toBe(false);
    });

    test('should log an error to the console if gptkApi is not available', () => {
        // Acceptance criteria: Critical errors must be logged to the browser console.
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        unsafeWindow.gptkApi = undefined;

        start();

        expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Google Photos Toolkit (GPTK) not found'));

        consoleErrorSpy.mockRestore();
    });

    test('should toggle Start/Stop button visibility during processing', async () => {
        // Acceptance criteria: The user should see a "Stop" button only during processing.
        unsafeWindow.gptkApi.getAlbums.mockResolvedValue({ items: [{ mediaKey: 'album1', title: 'My Album' }] });
        unsafeWindow.gptkApi.getAlbumPage.mockReturnValue(new Promise(() => {})); // Never resolves

        start();

        // Wait for albums to load
        await new Promise(resolve => process.nextTick(resolve));

        const startButton = document.querySelector('button.gpf-start-button');
        const stopButton = document.querySelector('button.gpf-stop-button');
        const sourceChecklist = document.querySelector('.gpf-source-album-checklist');

        // Select an album
        sourceChecklist.querySelector('input[value="album1"]').checked = true;

        // Click start to begin the (mocked) never-ending process
        startButton.click();

        expect(startButton.style.display).toBe('none');
        expect(stopButton.style.display).not.toBe('none');
    });

    test('should not crash and should show an error if getAlbums rejects', async () => {
        // Acceptance criteria: An API failure during album load should not crash the script.
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        unsafeWindow.gptkApi.getAlbums.mockRejectedValue(new Error('Network Error'));

        start();
        // Wait for the async rejection to be processed
        await new Promise(resolve => process.nextTick(resolve));

        const logWindow = document.querySelector('.gpf-log-window');
        expect(logWindow.textContent).toContain('Error loading albums');
        expect(consoleErrorSpy).toHaveBeenCalledWith('GPUF: Error loading albums', expect.any(Error));

        consoleErrorSpy.mockRestore();
    });
});
