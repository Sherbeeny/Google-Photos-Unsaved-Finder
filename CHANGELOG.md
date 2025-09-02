# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2025.09.02-0728] - 2025-09-01
### Fixed
- Prevented the script from executing multiple times on a page by adding the `@noframes` directive.
- The version log now reads the version dynamically from the script's metadata (`GM_info`) instead of being hardcoded.

## [2025.09.02-0717] - 2025-09-01
### Changed
- Updated `AGENTS.md` to use clearer workflow terminology ("prework", "work", "postwork").

## [2025.09.02-0709] - 2025-09-01
### Changed
- Updated `AGENTS.md` to explicitly clarify the high-level agent workflow (Pre-Plan -> Execute -> Pre-Commit).

## [2025.09.02-0651] - 2025-09-01
### Fixed
- Improved UI text contrast and font size for better readability.
- Added a version log to the console to help debug potential issues.

### Added
- A custom, programmatic linter setup to enforce code quality.

## [2025.09.01-1959] - 2025-09-01
### Added
- Created a Tampermonkey userscript `google-photos-unsaved-finder`.
- The script adds a "Start Google Photos Unsaved Finder" menu command.
- When clicked, the command opens a simple UI window with the text "Aha!" and a close button.
- Implemented a custom, manual TDD process to develop and test the script in a restrictive environment.
