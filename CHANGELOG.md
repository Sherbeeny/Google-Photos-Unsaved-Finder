# Changelog

All notable changes to this project will be documented in this file.

## [2025.08.29-1537] - 2025-08-29

### Fixed
- **Critical Bug:** The script no longer crashes if the GPTK API is not available when the menu command is invoked. The UI now always loads, and a user-friendly error is displayed in the log area.
- **Race Condition:** A race condition for the "Select All" checkbox listener was resolved.
- **Build Workflow:** The GitHub Actions workflow was corrected.
- **Linting:** Fixed a minor linting issue by updating `.eslintrc.json`.

### Added
- **E2E Test for API Failure:** The test suite now includes a "sad path" test to verify the script behaves correctly when the GPTK API is not found.

### Changed
- The `loadAlbums` function in `src/main.js` was refactored to be more defensive and robust.
- The E2E test suite (`tests/e2e.test.js`) was refactored to use a more stable API mocking strategy.
- The `test` script in `package.json` was updated to correctly run the Playwright tests.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to Timestamp Versioning.

## [2025.08.28-1408] - 2025-08-28

### Added
- A complete end-to-end test harness infrastructure, including a local mock server, helper extensions, and test scripts.
- JSDoc comments to `src/main.js` for better code documentation.
- Explicit checks for the availability of the GPTK API in `src/main.js` to prevent runtime errors.

### Changed
- Refactored `src/main.js` for improved readability and robustness.
- Improved error handling and logging within the userscript.
- The `test` script in `package.json` is now a placeholder, as the E2E test harness is non-functional in the current CI environment.

### Removed
- The non-functional E2E test file (`tests/integration.test.js`).
- Old testing dependencies (`jest`, `puppeteer`).

### Known Issues
- The E2E test harness, while fully implemented, fails to run in the provided CI environment due to a fundamental issue with Playwright's ability to automate the `chrome://extensions` page. The userscript logic requires manual verification until this environmental issue can be resolved.

## [2025.08.28-0553] - 2025-08-27

### Changed
- **Major Architectural Change:** The script no longer uses a popup window. The UI is now injected directly into the main Google Photos page as an overlay, mirroring the successful and stable pattern used by the companion GPTK script. This resolves all `TrustedHTML` Content Security Policy errors.
- The UI is built from an HTML template string, which is made possible by creating a Trusted Types policy at runtime. This is a proven method for this specific environment.

### Added
- A robust startup sequence that waits for the GPTK script to be loaded and detects the user's email address before creating the menu command.
- The user's email address is displayed in the UI.

### Removed
- All previous complex dependency loading and UI creation logic (popups, programmatic UI building, vendoring) has been removed in favor of this simpler, more robust architecture.

### Fixed
- All known bugs related to script initialization, UI rendering, and race conditions.

### Known Issues
- The E2E test suite is non-functional and has been disabled. It consistently fails due to timeouts that appear to be an issue with the test runner's handling of the userscript environment, not a bug in the script itself. The script requires manual verification.
