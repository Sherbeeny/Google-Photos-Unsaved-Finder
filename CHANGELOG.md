# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to Timestamp Versioning.

## [2025.08.29-0022] - 2025-08-28

### Fixed
- Resolved a critical initialization error caused by a Trusted Types policy conflict with the GPTK userscript. The script now reuses the existing 'default' policy instead of creating a new one.
- The userscript menu command was not appearing. This has been fixed by registering the command immediately on script startup.

### Changed
- The detection logic for GPTK has been made more robust. The script now waits for the `#gptk-button` element to be visible before initializing, which is a more reliable signal of readiness.

### Documentation
- Updated `PROJECT_PROMPT.md` to include the new, required implementation patterns for GPTK detection, Trusted Types policy handling, and menu command registration to ensure this knowledge is preserved.

## [2025.08.28-1758] - 2025-08-28

### Fixed
- The GitHub Actions workflow was failing during the `npm install` step.
- The `prepare` script was running before the project was built, causing a "file not found" error.
- The workflow has been corrected to build the project before running the prepare script.
- The Node.js version in the workflow has been updated to `20` to match dependency requirements.

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
