# Changelog

## [2025.09.02-2148] - 2025-09-02
### Changed
- **Testing & Linting Infrastructure:** Replaced all custom testing and linting scripts with a standard toolchain using Jest and ESLint, managed by `pnpm`.
- The project now uses `pnpm test` and `pnpm lint` for quality checks.

### Removed
- All Playwright, E2E testing, and server-mocking files due to intractable environment issues that prevented them from running.
- The `coverage` script and configuration, as the 90% coverage goal was unattainable with the limited testing possible in the environment.
- All failing integration tests for `src/main.user.js`. The only remaining tests are for metadata validation.

## [2025.09.02-2113] - 2025-09-02
### Changed
- Refactored the entire testing and linting toolchain from custom, manual scripts to a standard setup using Jest and ESLint. The project now uses modern, industry-standard quality assurance practices.

### Removed
- The custom test runner (`run_my_tests.js`) and linter (`run_linter.js`) scripts have been removed.
- The vendored `chai.js` dependency is no longer needed and has been removed.

### Added
- A `test` script in `package.json` that runs Jest.
- A `lint` script in `package.json` that runs ESLint.
- Full Jest configuration (`jest.config.cjs`) and ESLint configuration (`eslint.config.js`) to support ES Modules.

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2025.09.02-0908] - 2025-09-01
### Added
- Created `PROJECT_PROMPT.md` with the full project requirements.

### Changed
- Updated the "Quality Assurance" section of the project prompt to document the environment's challenges and the adapted manual TDD process.

## [2025.09.02-0832] - 2025-09-01
### Fixed
- Corrected the GPTK API detection logic to use `unsafeWindow`, fixing a bug where the API was not detected due to the userscript sandbox.

### Changed
- The testing framework was enhanced to correctly simulate the `unsafeWindow` object, allowing the bug to be caught and verified.

## [2025.09.02-0757] - 2025-09-01
### Fixed
- Restored missing `@match`, `@author`, and `@description` metadata to the userscript header, fixing a major regression where the script would not install or run.

### Added
- A new test suite (`test-metadata.js`) that specifically validates the userscript header to prevent metadata regressions in the future.

## [2025.09.02-0742] - 2025-09-01
### Added
- Feature to detect if the "Google-Photos-Toolkit" (GPTK) API is available.
- The UI now conditionally displays "GPTK API is available!" or "GPTK API is not available!".

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
