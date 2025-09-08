// We require the script inside each test after resetting modules to ensure a fresh state.

describe('TrustedTypes', () => {
    let mockPolicy;

    beforeEach(() => {
        // Reset modules to clear the cached `_policy` variable between tests.
        jest.resetModules();
        document.body.innerHTML = '';

        mockPolicy = {
            createHTML: jest.fn(html => html),
        };

        // Set up a default mock. Tests can override this setup.
        global.window.trustedTypes = {
            createPolicy: jest.fn().mockReturnValue(mockPolicy),
            policies: {
                get: jest.fn().mockReturnValue(mockPolicy),
            },
        };
    });

    afterEach(() => {
        delete global.window.trustedTypes;
        jest.clearAllMocks();
    });

    test('createUI should use TrustedTypes policy when available', () => {
        const { createUI } = require('../src/google_photos_unsaved_finder.user.js');
        // Acceptance criteria: When a TrustedTypes policy is present, the script must use it.
        createUI();

        // Check that the script attempted to create the 'default' policy.
        expect(window.trustedTypes.createPolicy).toHaveBeenCalledWith('default', expect.any(Object));

        // In this test's mock setup, creation succeeds, so .get() should NOT be called.
        expect(window.trustedTypes.policies.get).not.toHaveBeenCalled();

        // Check that the returned policy was used to create the UI.
        expect(mockPolicy.createHTML).toHaveBeenCalled();
    });

    test('getPolicy should not crash if policy creation fails because it already exists', () => {
        const { getPolicy } = require('../src/google_photos_unsaved_finder.user.js');
        // Acceptance criteria: If creating the 'default' policy fails, fall back to getting the existing one.

        const mockExistingPolicy = { createHTML: (html) => `mocked:${html}` };
        // Override the mock to simulate failure
        global.window.trustedTypes.createPolicy.mockImplementation(() => {
            throw new TypeError("Policy with name \"default\" already exists.");
        });
        global.window.trustedTypes.policies.get.mockReturnValue(mockExistingPolicy);

        let policy;
        expect(() => {
            policy = getPolicy();
        }).not.toThrow();

        expect(policy).toBe(mockExistingPolicy);
        expect(window.trustedTypes.createPolicy).toHaveBeenCalledWith('default', expect.any(Object));
        expect(window.trustedTypes.policies.get).toHaveBeenCalledWith('default');
    });
});
