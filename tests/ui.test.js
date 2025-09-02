// Import the script for its side effects, which will expose the functions on the global object for testing.
import '../src/main.user.js';

// Get the functions from the global object.
const { createUI } = global.testingExports;

describe('UI Creation', () => {
    // Store original unsafeWindow and restore it after each test
    const originalUnsafeWindow = global.unsafeWindow;

    afterEach(() => {
        global.unsafeWindow = originalUnsafeWindow;
        // Clean up the document body
        document.body.innerHTML = '';
    });

    test('when GPTK API is NOT available, should show "not available" message', () => {
        // Mock the unsafeWindow for this test case
        global.unsafeWindow = {};

        const ui = createUI();
        // The createUI function doesn't add the class, the start() function does.
        // Let's add it manually for the test to be more specific.
        ui.classList.add('gpf-window');
        document.body.appendChild(ui);

        const content = document.querySelector('.gpf-window div');
        expect(content).not.toBeNull();
        expect(content.textContent).toBe('GPTK API is not available!');
    });

    test('when GPTK API IS available, should show "available" message', () => {
        // Mock the unsafeWindow for this test case
        global.unsafeWindow = { gptkApi: {} };

        const ui = createUI();
        ui.classList.add('gpf-window');
        document.body.appendChild(ui);

        const content = document.querySelector('.gpf-window div');
        expect(content).not.toBeNull();
        expect(content.textContent).toBe('GPTK API is available!');
    });
});
