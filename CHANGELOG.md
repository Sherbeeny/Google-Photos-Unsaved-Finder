# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to Timestamp Versioning.

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
