# Agent Progress

**Task:** Fix userscript bugs (double execution, hardcoded version).
**Version:** `2025.09.02-0728`
**Status:** Complete

## Work Completed
- Fixed a bug where the script would execute twice by adding the `@noframes` directive.
- Refactored the version logging to be dynamic by using the `GM_info` API.
- Updated the custom test runner environment to mock `GM_info`.
- Followed the full prework -> work -> postwork process for this change, including versioning and documentation updates.
- Verified all changes with the custom test runner.
- This task is now complete and submitted. The userscript is now more robust.

---
*Previous session logs have been archived.*
