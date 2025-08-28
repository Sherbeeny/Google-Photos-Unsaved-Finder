# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to Timestamp Versioning.

## [2025.08.28-0408] - 2025-08-27

### Changed
- **Major Architectural Change:** Ripped out the Material Design Components library entirely in favor of native browser UI elements. This resolves numerous, persistent issues with dependency loading, Content Security Policy, and test environment stability. The script is now lighter and has zero runtime dependencies.
- The UI has been completely redesigned for a more compact and standard layout.
- Script initialization is now more robust, waiting for the companion GPTK script and the user's account info to be available before registering the menu command.

### Added
- The user's email address is now detected and displayed in the UI to clarify which account is being used.

### Removed
- The "Close" button and extra descriptive text were removed from the UI for a cleaner look.

### Fixed
- All known script loading and race condition bugs.

## [2025.08.28-0138] - 2025-08-27

### Fixed
- A race condition where the script could fail if its companion script (GPTK) had not finished initializing. The script now waits for GPTK to be ready before executing.
- A Content Security Policy (CSP) error that caused a blank popup window. The script now uses a CSP-safe method to build the UI, resolving the issue.

## [2025.08.28-0101] - 2025-08-27

### Fixed
- A critical bug where the script's menu command would not appear in Tampermonkey. This was caused by a Content Security Policy (CSP) error on `photos.google.com` blocking a dynamically loaded script. The script's entry point has been refactored to resolve this while maintaining compatibility with the E2E test environment.

## [2025.08.28-0027] - 2025-08-27

### Changed
- Removed minification (`terser`) from the build process to ensure the final userscript is human-readable, per user feedback.
- The CI/CD workflow now marks new builds as "pre-releases" on GitHub.

### Fixed
- The userscript build was invalid for Tampermonkey because the metadata header was being removed. This was corrected by removing the minification step.

## [2025.08.27-2346] - 2025-08-27

### Added
- JSDoc comments to all major functions in `src/main.js` for better code documentation.
- A visual MDC Linear Progress bar to the UI to provide better feedback during the scanning process.

### Fixed
- A critical typo in the MDC script URL that was preventing the script from loading and executing in the E2E test environment.
- Corrected 31 linting errors related to indentation and extra semicolons.

## [2025.08.27-1947] - 2025-08-27

### Added
- E2E tests using Playwright to ensure the userscript's functionality in a real browser environment.

### Changed
- Refactored the UI to use a popup window instead of a dialog, improving testability and avoiding CSP issues.
- Updated the build process to handle the new popup UI.
- Refactored the main script to be more robust and testable.

### Fixed
- Fixed a bug where the UI would not appear in the test environment due to CSP issues and incorrect MDC initialization.
- Corrected the mock data files to be valid JavaScript modules.

## [2025.08.27-0331] - 2025-08-26

### Added
- Initial implementation of the "Google Photos Saved Finder" userscript.
- Core functionality to filter photos in albums based on their "saved" status.
- UI styled with Google's Material Design Components.
- Batch processing to handle large albums and avoid rate-limiting.
- Comprehensive logging and feedback in the UI during processing.
- Setup for unit and integration testing with Vitest and JSDOM.
- GitHub Actions workflow for automated building and releasing.

### Changed
- Refactored the entire codebase to be modular and testable.

### Fixed
- Corrected various linting and code style issues.
