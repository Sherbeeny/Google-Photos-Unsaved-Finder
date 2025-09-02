# Google Photos Unsaved Finder

This project contains a Tampermonkey userscript that adds a basic UI window to a signed-in Google Photos page.

## Features

*   Adds a menu command named "Start Google Photos Unsaved Finder" to the Tampermonkey menu on Google Photos pages.
*   When clicked, it displays a simple, non-draggable UI window with the text "Aha!" and a close button.

## Installation

1.  Make sure you have a userscript manager extension installed in your browser (e.g., [Tampermonkey](https://www.tampermonkey.net/) or [Greasemonkey](https://www.greasespot.net/)).
2.  The userscript is the single file located at `src/main.user.js`.
3.  You can install the script by navigating to the raw version of the file in a browser where Tampermonkey is active, or by copying the entire content of the file and pasting it into a new script in your userscript manager's dashboard.

## Development & Testing

This project was developed using a custom **"Manual TDD"** approach due to severe, unresolvable issues in the development environment that prevented the use of standard Node.js package managers and testing frameworks.

The testing setup is completely self-contained and does not use `node_modules`.

### Running the Test
To run the included test, execute our custom test runner script from the root directory:
```bash
node run_my_tests.js
```
Alternatively, you can use the custom script defined in `package.json`:
```bash
npm run examine
```
