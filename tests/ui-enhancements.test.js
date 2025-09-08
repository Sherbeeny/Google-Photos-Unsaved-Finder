// Mock the global Tampermonkey functions and objects before the script is required.
global.GM_addStyle = jest.fn();
global.GM_registerMenuCommand = jest.fn();
global.GM_info = { script: { version: 'test-version' } };
global.unsafeWindow = {};

// By requiring the script, we allow Jest to instrument it for coverage.
const { createUI, start, loadAlbumData } = require('../src/google_photos_unsaved_finder.user.js');

describe('UI Enhancements', () => {
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

    describe('Source Album Checklist', () => {
        test('should render a div for the source albums, which will fail before implementation', () => {
            const checklist = document.querySelector('.gpf-source-album-checklist');
            expect(checklist).not.toBeNull();
        });
    });

    describe('Create Album Feature', () => {
        test('should have a create album input container, which will fail before implementation', () => {
            const newAlbumInputContainer = document.querySelector('.gpf-create-album-input-container');
            expect(newAlbumInputContainer).not.toBeNull();
        });
    });

    describe('Start Button', () => {
        test('should be in a right-aligned container, which will fail before implementation', () => {
            const startButton = document.querySelector('.gpf-start-button');
            expect(startButton.parentElement.style.textAlign).toBe('right');
        });
    });

    describe('Close Button', () => {
        test('should contain an SVG, which will fail before implementation', () => {
            const closeButton = document.querySelector('.gpf-close-x-button');
            expect(closeButton.querySelector('svg')).not.toBeNull();
        });
    });
});
