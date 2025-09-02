# Project: Google Photos Saved Finder

## 1. Project Goal

The primary goal is to create a robust and user-friendly userscript, "Google Photos Unsaved Finder". This script will enhance the functionality of the existing **Google Photos Toolkit (GPTK)** by allowing users to filter photos within one or more albums based on their "saved" status (i.e., whether they have been saved to the user's main library) and add the filtered photos to another album for easy bulk actions.

## 2. Core Dependencies

The userscript's functionality is entirely dependent on the API exposed by the **Google Photos Toolkit (GPTK)**.

*   **GPTK GitHub Repository:** [https://github.com/xob0t/Google-Photos-Toolkit](https://github.com/xob0t/Google-Photos-Toolkit)
*   **Required GPTK Userscript Version:** [v2.10.0](https://github.com/xob0t/Google-Photos-Toolkit/releases/download/v2.10.0/google_photos_toolkit.user.js)

The final userscript **MUST NOT** use `@require` to load GPTK. It should rely on GPTK being already installed by the user, and it should gracefully detect its absence.

## 3. Product Requirements Document (PRD)

### 3.1. Core Functionality

*   **Activation:** The script must not add a new button to the Google Photos header. Instead, it will register a menu command with Tampermonkey using `GM_registerMenuCommand`. The command should be named "Open Google Photos Unsaved Finder" and will open the script's UI.
*   **Initialization:** The script must first show its UI before detecting if the GPTK API is available.

*   **Key Implementation Patterns:** To ensure compatibility and a smooth user experience, the following implementation patterns **must** be followed:
    *   **Menu Command Registration:** The Tampermonkey menu command (`GM_registerMenuCommand`) **must** be registered immediately when the script first executes.
    *   **UI Display:** The script's UI **must** be displayed immediately when the user invokes the menu command. The script **must not** wait for GPTK to be ready or perform any other checks before showing its own UI.
    *   **Graceful API Handling:** After the UI is displayed, the script should attempt to use the GPTK API (e.g., to load albums). This API call **must** be wrapped in a `try...catch` block. If the call fails (because GPTK is not ready or not installed), the error must be caught gracefully and a user-friendly message must be logged to the script's own feedback area. The script must not use `alert()` or block execution.
    *   **Trusted Types Policy:** To avoid conflicts with GPTK, the script must reuse the `"default"` Trusted Types policy if it already exists. It should only create it as a fallback.

### 3.2. User Interface (UI)

The UI must be a single, clean modal window adhering to Google's Material Design principles with a little x button on the top right corner for closing the UI.

*   **UI Controls:**
    *   **Source Album Selector:** A checklist menu to choose the source album(s). This list must be dynamically populated (auto refreshed) by fetching all of the user's albums via the GPTK API. The first item is always "Select All".
    *   **Filter Type:** A set of radio buttons to select the filter mode:
        *   `Any` (no filter, process all items)
        *   `Saved` (only items already saved to the user's library)
        *   `Not Saved` (only items not yet saved to the user's library)
    *   **Destination Album:** The UI must provide two methods for choosing a destination:
        1.  A dropdown (`< select >`) to choose an existing album.
        2.  A text input (`< input type="text" >`) to specify the name of a new album to be created.
    *   **Batch Size:** A number input (`< input type="number" >`) allowing the user to set the processing batch size. This should default to a safe value (e.g., 20).
*   **Action Buttons:**
    *   A "Start" button to begin the filtering and album-adding process.
    *   A "Cancel" button that allows the user to gracefully stop the process at any time.
*   **Feedback Area:**
    *   A dedicated area in the UI for providing real-time feedback, including:
        *   A text-based status line (e.g., "Fetching albums...", "Processing batch 1 of 10...").
        *   Statistics (e.g., "Items scanned: X/Y", "Matches found: Z").
        *   A detailed, scrollable log window for more verbose output.

### 3.3. Core Logic

*   The script must fetch all albums to populate the UI dropdowns each UI appearance. and to show "Refreshing albums..." in the dropdown menu until the albums are ready.
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

*   The final userscript file should be google_photos_unsaved_finder.user.js
*   A GitHub Actions workflow must be created at `.github/workflows/build.yml`.
*   This workflow must trigger on pushes to the `by_ai` branch, and automatically create a new GitHub PreRelease, uploading the generated `.user.js` file as a release asset.

### 3.5. Quality Assurance

**Environmental Constraints:** Standard Node.js tooling (`npm`, `pnpm`) has been proven to be non-functional in the development environment due to a non-persistent filesystem that prevents the creation of a `node_modules` directory and its associated executables.

**Adapted QA Process:** To overcome these constraints, this project will adhere to a custom "Manual TDD" process.

*   **Manual Dependency Management:** Any necessary third-party libraries (e.g., for testing) will be manually downloaded via `curl` and stored in a version-controlled `vendor` directory. This project will not have a `node_modules` directory.
*   **Custom Testing Framework:** Testing will be performed using custom-written Node.js scripts (`run_my_tests.js`) that manually load test files and dependencies. This process has been proven effective for unit and logic testing.
*   **Integration Testing:** A full browser-based integration test is not feasible due to the inability to install frameworks like Playwright. The integration between this script and GPTK will be tested by mocking the `unsafeWindow.gptkApi` object, simulating its presence or absence for different test cases.
*   **Linting:** A full linting setup is not feasible. Code quality will be maintained through careful manual code review against standard JavaScript best practices.
*   **Code Coverage:** Coverage reporting is not possible with this custom framework. Quality will be ensured through rigorous adherence to the TDD Red-Green-Refactor cycle for all new logic.
*   **Postwork Checks:** The `package.json` will contain a custom script (`"examine": "node run_my_tests.js"`) to perform all possible automated checks as part of the postwork routine.
