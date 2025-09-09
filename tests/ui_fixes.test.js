// Mock Tampermonkey functions
global.GM_addStyle = jest.fn();
global.GM_registerMenuCommand = jest.fn();
global.GM_info = { script: { version: 'test-version' } };
// Mock the gptkApi object on the unsafeWindow
global.unsafeWindow = {
  gptkApi: {
    getAlbums: jest.fn().mockResolvedValue({ items: [] }), // Mock getAlbums to prevent errors
  },
};

const { start } = require('../src/google_photos_unsaved_finder.user.js');

describe('UI Fixes Verification', () => {
  beforeEach(() => {
    // Reset mocks and the document body before each test
    jest.clearAllMocks();
    document.body.innerHTML = '';
  });

  test('should apply correct CSS for UI fixes', async () => {
    // Run the start function to trigger UI creation and GM_addStyle
    await start();

    // Check that GM_addStyle was called
    expect(global.GM_addStyle).toHaveBeenCalledTimes(1);

    // Get the CSS string passed to GM_addStyle
    const cssString = global.GM_addStyle.mock.calls[0][0];

    // 1. Verify the source album list alignment fix
    // We expect `.gpf-checklist-item` to have `justify-content: flex-start;`
    // Using a regex to be flexible with whitespace
    expect(cssString).toMatch(/\.gpf-checklist-item\s*\{[^}]*justify-content:\s*flex-start;[^}]*\}/);

    // 2. Verify the new album name input width fix
    // We expect `.gpf-new-album-name-input` to have `width: 100%;`
    // We also want to ensure the old `calc` value is gone.
    expect(cssString).toMatch(/\.gpf-new-album-name-input\s*\{[^}]*width:\s*100%;[^}]*\}/);
    expect(cssString).not.toMatch(/\.gpf-new-album-name-input\s*\{[^}]*width:\s*calc\(100%\s*-\s*16px\);[^}]*\}/);
  });
});
