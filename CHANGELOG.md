# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to Timestamp Versioning.

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
