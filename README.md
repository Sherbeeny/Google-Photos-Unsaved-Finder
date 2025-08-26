# Google Photos Saved Finder

A userscript that works with the Google Photos Toolkit (GPTK) to find photos in a specific album based on their "saved" status and add them to another album for easy bulk actions.

## What It Does

This tool is designed to solve a specific problem: managing photos within shared albums. When someone shares an album with you, the photos are not automatically part of your library. You have to save them manually. This tool helps you find which photos in an album you have **saved** or **not saved** to your own library and collects them for you.

## Prerequisites

Before installing, you **MUST** have the following:

1.  A desktop browser like Chrome or Firefox.
2.  A userscript manager extension. The recommended one is **[Tampermonkey](https://www.tampermonkey.net/)**.
3.  The original **[Google Photos Toolkit (GPTK)](https://github.com/xob0t/Google-Photos-Toolkit)** userscript must be installed and active. This tool is a companion to GPTK and will not work without it.

## Installation

1.  Ensure you have met all the prerequisites above.
2.  Go to the [Releases page](https://github.com/Sherbeeny/Google-Photos-Saved-Finder/releases) of this repository.
3.  Click on the `gpsf.user.js` file from the latest release to install it.
4.  Your userscript manager (Tampermonkey) should automatically detect the file and prompt you to install it.

## Usage Instructions

1.  Go to `photos.google.com`.
2.  Click the Tampermonkey extension icon in your browser's toolbar.
3.  In the menu that appears, click on **"Start Google Photos Saved Finder"**.
4.  A  window will appear on the page.
5.  Use the controls to:
    *   Select your **Source Album(s)** (e.g., the shared album you want to check).
    *   Choose the **Filter Type** ("Not Saved" to find photos to add to your library).
    *   Select a **Destination Album** or type the name of a new one to be created.
    *   (Optional) Adjust the **Batch Size** if you have a very large album. 20 is safe.
6.  Click **Start**.
7.  The progress window will show the status. Do not close the tab while the process is running.
8.  When complete, the photos that matched your filter will be in the destination album.

---

## For Developers and AI Agents

This is a modern userscript project built with Rollup.

*   **`package.json`**: Defines the project, its dependencies, and scripts.
*   **`rollup.config.mjs`**: The build configuration file.
*   **`src/`**: Contains the source code.

### To build the project locally:

1.  Clone the repository.
2.  Run `npm install` to install dependencies.
3.  Run `npm run build` to create the final userscript in the `dist` folder.
