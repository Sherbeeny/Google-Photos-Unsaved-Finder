# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to Timestamp Versioning.

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
