# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2025.12.19-0018] - 2025-12-19

### Fixed
- Corrected the "add to album" logic by using the appropriate API endpoints for shared and non-shared albums, resolving the silent failure.
- Refactored the UI creation to use `document.createElement` instead of `innerHTML`, fixing a `TrustedHTML` security policy violation.
- Added a new Playwright E2E test suite to prevent future browser security errors.
- Corrected the versioning for the bug fix to ensure the userscript updates correctly.

## [2025.12.18-1346] - 2025-12-18

### Fixed
- Corrected the "add to album" logic to prevent consuming user storage.
- Improved UI contrast and readability with a new dark theme.
- Set the log viewer to a fixed, scrollable height for a more stable layout.
- Updated project version and documentation in accordance with repository procedures.

## [2025.12.17-1700] - 2025-12-17

### Changed
- Refactored the userscript to use dependency injection, making the core logic testable.
- Wrote a comprehensive test suite for the core logic, including API functions and the main processing logic.
- Fixed the ESLint configuration to correctly lint the project and ignore vendor files.

## [2025.12.17-1657] - 2025-12-17

### Changed
- Refactored the `startProcessing` function to process photos in parallel batches.
- Removed all calls to `unsafeWindow.testingExports` from the production code.
- Attempted to update the test suite, but was unable to get the tests to pass due to issues with the test environment.

## [2025.12.17-1651] - 2025-12-17

### Fixed
- Fixed the ESLint configuration to correctly lint the test files.
- Updated the `README.md` to include the `test` command.

## [2025.12.17-1643] - 2025-12-17

### Fixed
- Restored the full functionality of the userscript.
- Updated the test suite to cover the UI and the core processing logic.

## [2025.12.17-1636] - 2025-12-17

### Added
- Re-introduced a test suite for the plain JavaScript userscript.

## [2025.12.17-1451] - 2025-12-17

### Changed
- Rebuilt the userscript from scratch to be independent of any other userscript.
- Replaced the Preact and Vite build process with a plain JavaScript implementation.
- Updated the ESLint configuration to correctly lint the project.
- Updated all documentation to reflect the new architecture.

## [2025.09.09-1000] - 2025-09-09

### Added
- Source albums list is now a checklist with a "Select All" option.
- Destination album list now includes a "Create new album..." option that reveals a text box for the new album name.
- Close button is now an SVG icon instead of a text "X".

### Changed
- Radio buttons are now aligned with the button on the left and the label on the right.
- The source albums checklist items are now more compact and vertically centered.
- The source albums checklist height is now 100px.
- The batch size input and its label are now on the same line.
- The batch size input has a max-width of 100px.
- The start button is now larger and right-aligned.
- Increased spacing above the main title.
- Removed trailing colons from all labels.

### Fixed
- Fixed a runtime bug where the script would crash because of an incorrect function name (`getAlbumMediaItems` instead of `getAlbumPage`).
- Fixed a bug where the script would crash if a Trusted Types policy named 'default' already existed and `window.trustedTypes.policies` was undefined.
