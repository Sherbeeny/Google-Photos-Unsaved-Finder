# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
