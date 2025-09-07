# Agent Progress

## Version: 2025.09.06-0153

### Plan

I will build a full test harness to reproduce and fix the userscript bugs, following a strict TDD methodology as defined in `AGENTS.md`.

**Phase 1: Pre-Work Routine**

1.  **`prework:` Versioning and Initial Documentation.**
    *   Generate a new timestamp-based version string (`YYYY.MM.DD-HHMM`).
    *   Update the version in `package.json`.
    *   Update `AGENT_PROGRESS.md` with the new version, the full plan, acceptance criteria, and the list of tests to be created.

**Phase 2: Work (Test Harness Construction & Bug Fixes)**

2.  **`work:` Scaffold Test Environment.**
    *   Create the required directory structure: `scripts/`, `mocks/`, `specs/`, `extension/`, `tools/`, `tampermonkey/`.

3.  **`work:` Prepare Tampermonkey Dependency.**
    *   Download the Tampermonkey CRX from `https://www.tampermonkey.net/crx/tampermonkey_stable.crx` into `tampermonkey/`.
    *   Create a script to unpack the CRX file into a `tampermonkey/unpacked` directory for Playwright to use.

4.  **`work:` Create Userscript Fetching and Patching Tools.**
    *   Create `tools/fetch-userscripts.js` to download the GPTK userscript to `scripts/gptk.original.user.js`.
    *   Create `tools/patch-gptk.js` to add the `@match *://127.0.0.1/*` directive and save the result as `scripts/gptk.test.user.js`.
    *   Run these scripts to ensure they work correctly.

5.  **`work:` Create Mock Server Environment.**
    *   Create `tools/serve-photos.js` to run an HTTPS server on `127.0.0.1`, serving from the `mocks/` and `scripts/` directories.
    *   Create `mocks/photos.html` containing the target element `<div class="J3TAe">` for GPTK to inject its button.

6.  **`work:` Create Installer Helper Extension.**
    *   Create `extension/manifest.json` and `extension/background.js`.
    *   The background script will open tabs for our test userscripts to trigger Tampermonkey's installation UI on browser launch.

7.  **`work:` Write Initial Failing Integration Test (TDD: Red).**
    *   Install Playwright (`pnpm add -D playwright`).
    *   Create `tests/integration.test.js`.
    *   This test will launch Chromium with Tampermonkey and the helper extension loaded.
    *   It will navigate to the mock server and assert that the GPTK button (`#gptk-button`) and our script's UI (`.gpf-window`) do **not** appear, thereby reproducing the "Silent Crash on Startup" bug. This test is expected to **fail** initially in a specific way (e.g., timeout waiting for an element that never appears).
    *   Commit the failing test as per `AGENTS.md` guidelines.

8.  **`work:` Fix Core Bugs (TDD: Green).**
    *   **Bug 1: Silent Crash & Startup Logic.**
        *   Modify the userscript's `start()` function to handle the promise rejection from `loadAlbumData()`.
        *   Implement the mandatory startup logic: The UI must render first. Add an ID to the `<h2>` title. Use an `IntersectionObserver` to detect when the header is visible, and only then trigger `loadAlbumData()`.
    *   **Bug 2: Incorrect Album Data Parsing.**
        *   Update the `loadAlbumData` function to correctly parse the API response (using `response.items` instead of `response.albums` and `album.mediaKey` instead of `album.id`).
        *   Use the provided JSON structure as the mock response from the server.
    *   **Bug 3: Missing Console Logs.**
        *   Review error handling and status message paths to ensure they are all properly logged to the browser console.
    *   Run the integration test until it passes, confirming the fixes.

**Phase 3: Post-Work Routine**

9.  **`postwork:` Final Verification and Documentation.**
    *   Run `pnpm lint` and fix any issues.
    *   Run the full test suite (`pnpm test`) to ensure all tests pass.
    *   Update `AGENT_PROGRESS.md` with the final results and test outcomes.
    *   Create a `CHANGELOG.md` entry for the new version.
    *   Perform the "Context Window Refresh" by re-reading `AGENTS.md`, `PROJECT_PROMPT.md`, etc., as specified.
    *   Submit the changes for review.

### Acceptance Criteria

*   The test harness successfully launches a browser with Tampermonkey.
*   The harness navigates to a local mock server.
*   The test harness can successfully install and run both the GPTK and the "Unsaved Finder" userscripts.
*   A Playwright test can successfully identify the GPTK button on the mock page.
*   The "Silent Crash" bug is reproduced with a failing test (the Unsaved Finder UI does not appear).
*   The userscript correctly handles promise rejections on startup.
*   The userscript correctly parses the `items` and `mediaKey` fields from the album API.
*   The userscript renders its UI *before* loading album data.
*   Data loading is triggered by the UI header becoming visible.
*   All errors and status messages are mirrored to the console.

### Tests to be Created

*   `tests/integration.test.js`:
    *   Test 1: "should launch the browser with extensions and install the userscripts."
    *   Test 2: "should show the GPTK button on the mock photos page."
    *   Test 3: "should reproduce the silent crash when GPTK is active."
    *   Test 4: "should display 'Loading albums...' in the UI before albums are fetched."
    *   Test 5: "should correctly fetch and display album titles from the mock API."
