# Google Photos Unsaved Finder

This project provides a Tampermonkey userscript inspired by [Google Photos Toolkit](https://github.com/xob0t/Google-Photos-Toolkit) to help users find photos in their Google Photos albums that are not saved to their main library.

## Features

*   **Album Analysis**: Scans selected Google Photos albums.
*   **Filtering**: Filters media items to show only "Saved", "Not Saved", or "Any" items.
*   **UI Integration**: Adds a "Start Google Photos Unsaved Finder" command to the Tampermonkey menu on Google Photos pages, which opens a user-friendly interface.
*   **Batch Processing**: Processes photos in batches to handle large albums gracefully.
*   **Progress Log**: Includes a logging window to show the script's progress and any errors.

## Installation

1.  Make sure you have a userscript manager extension installed in your browser (e.g., [Tampermonkey](https://www.tampermonkey.net/)).
2.  The userscript for this project is the single file located at `src/google_photos_unsaved_finder.user.js`.
3.  You can install the script by navigating to the raw version of the file in a browser where your userscript manager is active, or by copying its content and pasting it into a new script in your manager's dashboard.

## Development

This project uses `pnpm` for package management.

### Setup
```bash
# Install dependencies
pnpm install
```

### Linting
To run the linter:
```bash
pnpm lint
```

### Testing
To run the tests:
```bash
pnpm test
```
