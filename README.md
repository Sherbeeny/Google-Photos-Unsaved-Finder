# Google Photos Unsaved Finder

This project provides a Tampermonkey userscript to help users find photos in their Google Photos albums that are not saved to their main library. It works as a companion script to the **Google Photos Toolkit (GPTK)**, which must be installed and active for this script to function.

## Features

*   **Album Analysis**: Scans selected Google Photos albums.
*   **Filtering**: Filters media items to show only "Saved", "Not Saved", or "Any" items.
*   **UI Integration**: Adds a "Start Google Photos Unsaved Finder" command to the Tampermonkey menu on Google Photos pages, which opens a user-friendly interface.
*   **Batch Processing**: Processes photos in batches to handle large albums gracefully.
*   **Progress Log**: Includes a logging window to show the script's progress and any errors.

## Prerequisites

This userscript **requires** the "Google Photos Toolkit (GPTK)" userscript to be installed and enabled. The GPTK provides the necessary API (`gptkApi`) that this script uses to interact with Google Photos.

## Installation

1.  Make sure you have a userscript manager extension installed in your browser (e.g., [Tampermonkey](https://www.tampermonkey.net/)).
2.  Install the "Google Photos Toolkit (GPTK)" userscript.
3.  The userscript for this project is the single file located at `src/google_photos_unsaved_finder.user.js`.
4.  You can install the script by navigating to the raw version of the file in a browser where your userscript manager is active, or by copying its content and pasting it into a new script in your manager's dashboard.

## Development & Testing

This project uses `pnpm` for package management and `Jest` for testing.

### Setup
```bash
# Install dependencies
pnpm install
```

### Running Tests
To run the test suite:
```bash
npm test
```
