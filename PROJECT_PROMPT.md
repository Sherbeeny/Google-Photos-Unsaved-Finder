# Project: Google Photos Saved Finder

## 1. Project Goal

The primary goal is to create a robust and user-friendly userscript, "Google Photos Unsaved Finder". This script will allow users to filter photos within one or more albums based on their "saved" status (i.e., whether they have been saved to the user's main library) and add the filtered photos to another album for easy bulk actions.

## 2. Product Requirements Document (PRD)

### 2.1. Core Functionality

*   **Activation:** The script must register a menu command with Tampermonkey using `GM_registerMenuCommand`. The command should be named "Open Google Photos Unsaved Finder" and will open the script's UI.
*   **UI:** The UI should be a simple modal window that allows the user to select source albums, a filter type, and a destination album.
*   **Filtering:** The script must be able to filter photos by their "saved" status.
*   **Batch Processing:** The script must process photos in batches to avoid rate-limiting errors.
*   **Logging:** The script must provide a log of its progress and any errors.

### 2.2. Quality Assurance

*   **Linting:** Code quality is enforced by **ESLint**. The command `pnpm lint` will check all source files against the rules defined in `eslint.config.js`.
