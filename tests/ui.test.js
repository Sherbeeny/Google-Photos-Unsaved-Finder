
const { JSDOM } = require('jsdom');
const { createUI } = require('../src/google_photos_unsaved_finder.user.js');

describe('UI Tests', () => {
  let dom;
  let document;

  beforeEach(() => {
    dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    document = dom.window.document;
    global.document = document;

    // Mock the global fetch to prevent unhandled promise rejections
    global.fetch = jest.fn(() =>
      Promise.resolve({
        text: () => Promise.resolve(')]}\'\n[["wrb.fr",null,"[]"]]'),
      })
    );

    // Mock GM_info which is provided by the userscript environment
    global.GM_info = {
      script: {
        version: '2025.12.19-0137'
      }
    };
    global.unsafeWindow = {
      WIZ_global_data: {
        Dbw5Ud: 'rapt_token',
        oPEP7c: 'account_info',
        FdrFJe: 'f.sid_token',
        cfb2h: 'bl_token',
        eptZe: '/_/',
        SNlM0e: 'at_token',
      },
    };
  });

  afterEach(() => {
    // Clean up the DOM and global mocks
    document.body.innerHTML = '';
    delete global.document;
    delete global.GM_info;
  });

  // Acceptance Criteria: The log viewer should display the script version on load.
  test('should display the userscript version in the log viewer on UI load', () => {
    // Arrange: Set up the UI by passing the JSDOM document
    createUI(document);

    // Act: Find the log viewer and check its content
    const logViewer = document.querySelector('.gpuf-log-viewer');
    const firstLogEntry = logViewer.firstChild;

    // Assert: The first log entry should contain the version number
    expect(firstLogEntry).not.toBeNull();
    expect(firstLogEntry.textContent).toContain('Version: 2025.12.19-0137');
  });
});
