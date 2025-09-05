// By requiring the script, we allow Jest to instrument it for coverage.
const { createUI } = require('../src/google_photos_unsaved_finder.user.js');

describe('TrustedTypes Compliance', () => {
    let mockPolicy;

    beforeEach(() => {
        document.body.innerHTML = '';
        // Mock the TrustedTypes API
        mockPolicy = {
            createHTML: jest.fn(html => html), // The mock just returns the string
        };
        global.window.trustedTypes = {
            createPolicy: jest.fn().mockReturnValue(mockPolicy),
            policies: {
                has: jest.fn().mockReturnValue(true), // Pretend the 'default' policy exists
                get: jest.fn().mockReturnValue(mockPolicy),
            },
        };
    });

    afterEach(() => {
        // Clean up the mock
        delete global.window.trustedTypes;
        jest.clearAllMocks();
    });

    test('createUI should use TrustedTypes policy when available', () => {
        // Acceptance criteria: When a TrustedTypes policy is present, the script must use it.

        // The createUI function uses `innerHTML`, which would throw an error in a real
        // Trusted Types environment. In our JSDOM mock, we can't easily simulate that
        // error. Instead, we test for the desired behavior: that our mock policy was used.
        createUI();

        // Check that the script attempted to get the 'default' policy
        expect(window.trustedTypes.policies.has).toHaveBeenCalledWith('default');
        expect(window.trustedTypes.policies.get).toHaveBeenCalledWith('default');

        // Check that createHTML was called multiple times to build the UI
        expect(mockPolicy.createHTML).toHaveBeenCalled();
    });
});
