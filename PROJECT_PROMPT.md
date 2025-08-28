# Project: Google Photos Saved Finder

## 1. Project Goal

The primary goal is to create a robust and user-friendly userscript, "Google Photos Saved Finder". This script will enhance the functionality of the existing **Google Photos Toolkit (GPTK)** by allowing users to filter photos within one or more albums based on their "saved" status (i.e., whether they have been saved to the user's main library) and add the filtered photos to another album for easy bulk actions.

## 2. Core Dependencies

The userscript's functionality is entirely dependent on the API exposed by the **Google Photos Toolkit (GPTK)**.

*   **GPTK GitHub Repository:** [https://github.com/xob0t/Google-Photos-Toolkit](https://github.com/xob0t/Google-Photos-Toolkit)
*   **Required GPTK Userscript Version:** [v2.10.0](https://github.com/xob0t/Google-Photos-Toolkit/releases/download/v2.10.0/google_photos_toolkit.user.js)

The final userscript **MUST NOT** use `@require` to load GPTK. It should rely on GPTK being already installed by the user, and it should gracefully detect its absence.

## 3. Product Requirements Document (PRD)

### 3.1. Core Functionality

*   **Activation:** The script must not add a new button to the Google Photos header. Instead, it will register a menu command with Tampermonkey using `GM_registerMenuCommand`. The command should be named "Start Google Photos Saved Finder" and will open the script's UI.
*   **Initialization:** The script must reliably detect if the GPTK API is available before running its main logic. It should use manually enable the GPTK core process flag.

*   **Key Implementation Patterns:** To ensure compatibility and a smooth user experience, the following implementation patterns **must** be followed:
    *   **Menu Command Registration:** The Tampermonkey menu command (`GM_registerMenuCommand`) **must** be registered immediately when the script first executes. The function called by the command should then handle the task of waiting for GPTK to be ready. This ensures the command is always visible to the user.
    *   **GPTK Detection:** The script **must** detect that GPTK is ready by waiting for the GPTK button element (`#gptk-button`) to be present in the page's DOM. This is the most reliable signal.
    *   **Trusted Types Policy:** To avoid conflicts with GPTK, the script **must not** create its own Trusted Types policy with a unique name. Instead, it must check if the policy named `"default"` already exists. If it does, the script must reuse that policy. If it does not, it should create the `"default"` policy as a fallback.

### 3.2. User Interface (UI)

The UI must be a single, clean modal window adhering to Google's Material Design principles.

*   **UI Controls:**
    *   **Source Album Selector:** A checklist menu to choose the source album(s). This list must be dynamically populated (auto refreshed) by fetching all of the user's albums via the GPTK API.
    *   **Filter Type:** A set of radio buttons to select the filter mode:
        *   `Any` (no filter, process all items)
        *   `Saved` (only items already saved to the user's library)
        *   `Not Saved` (only items not yet saved to the user's library)
    *   **Destination Album:** The UI must provide two methods for choosing a destination:
        1.  A dropdown (`<select>`) to choose an existing album.
        2.  A text input (`<input type="text">`) to specify the name of a new album to be created.
    *   **Batch Size:** A number input (`<input type="number">`) allowing the user to set the processing batch size. This should default to a safe value (e.g., 20).
*   **Action Buttons:**
    *   A "Start" button to begin the filtering and album-adding process.
    *   A "Cancel" button that allows the user to gracefully stop the process at any time.
*   **Feedback Area:**
    *   A dedicated area in the UI for providing real-time feedback, including:
        *   A text-based status line (e.g., "Fetching albums...", "Processing batch 1 of 10...").
        *   Statistics (e.g., "Items scanned: X/Y", "Matches found: Z").
        *   A detailed, scrollable log window for more verbose output.

### 3.3. Core Logic

*   The script must fetch all albums to populate the UI dropdowns upon initialization.
*   When "Start" is clicked, the script will get all media items from the selected source album.
*   **Crucially, the filtering process must be implemented using SEQUENTIAL BATCHING to avoid rate-limiting errors.**
    *   The script will group the items into chunks based on the user-defined batch size.
    *   It will process one chunk at a time. For each chunk, it can make parallel requests (`Promise.all`).
    *   It must `await` the completion of the entire chunk before proceeding to the next one.
    *   The previous project's overly aggressive concurrent promise pool **MUST BE AVOIDED.**
*   For each item, the script will call `gptkApi.getItemInfo()` to check the `savedToYourPhotos` boolean property.
*   Items matching the filter criteria will be collected.
*   After checking all items, the collected items will be added to the destination album (creating it first if a new name was provided).

### 3.4. Build and Release

*   The project must include a `package.json` and a Rollup build process (`rollup.config.mjs`) to bundle the source files into a single `dist/gpsf.user.js` file.
*   A GitHub Actions workflow must be created at `.github/workflows/build.yml`.
*   This workflow must trigger on pushes to the `by_ai` branch, build the userscript, and automatically create a new GitHub Release, uploading the generated `.user.js` file as a release asset.

### 3.5. Quality Assurance

*   The project must be configured with ESLint for code linting.
*   The project must be configured with Vitest and Playwright for testing.
*   At a minimum, unit tests for the core non-UI logic should be created.
*   An integration test that simulates the execution of both GPTK and the new userscript in a real browser environment via Playwright must be created to verify that there are no initialization conflicts.
*   A `validate` script must be added to `package.json` to perform full testing and checks on the final bundled userscript file as a pre-commit check.
