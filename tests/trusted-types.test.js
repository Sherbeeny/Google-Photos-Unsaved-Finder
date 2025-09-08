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

    test('getPolicy should not crash if policies object is missing', () => {
        const { getPolicy } = require('../src/google_photos_unsaved_finder.user.js');
        // Acceptance criteria: If `createPolicy` fails and `window.trustedTypes.policies` is undefined,
        // the script must not crash and should return a fallback policy.

        // Override the mock to simulate the specific failure case
        global.window.trustedTypes.createPolicy.mockImplementation(() => {
            throw new TypeError("Policy with name \"default\" already exists.");
        });
        // This is the key to reproducing the bug: the `policies` object is missing.
        delete global.window.trustedTypes.policies;

        let policy;
        expect(() => {
            policy = getPolicy();
        }).not.toThrow();

        expect(policy).toBeDefined();
        expect(typeof policy.createHTML).toBe('function');
        expect(policy.createHTML('test')).toBe('test'); // Ensure it's a valid fallback
    });
});
