# Agent Progress

## Task: UI Corrections and AGENTS.md Update

**Version:** `2025.09.08-1900`

### Plan

**Prework**
1.  **prework: Versioning and Progress Update.**
    *   Generate a new timestamp-based version string.
    *   Update `src/google_photos_unsaved_finder.user.js` with the new version.
    *   Update `AGENT_PROGRESS.md` with this new plan and acceptance criteria.

**Work**
2.  **work: Correct UI Layout.**
    *   Modify the CSS in `GM_addStyle` to ensure:
        *   Checkboxes in the source album list are on the left, labels on the right, with compact spacing.
        *   Radio buttons are on the left, labels on the right.
    *   Run tests to ensure no regressions.
3.  **work: Update AGENTS.md.**
    *   I will edit `AGENTS.md` to clarify the plan structure rules (one Prework, one Postwork).

**Postwork**
4.  **postwork: Final Verification, Documentation, and Submission.**
    *   Perform a new frontend verification to visually confirm all UI corrections.
    *   Update `CHANGELOG.md`.
    *   Request a code review.
    *   Submit the final, corrected implementation.

### Acceptance Criteria

*   Source albums checklist: checkbox on the left, label on the right, compact spacing.
*   Radio buttons: button on the left, label on the right.
*   Batch size input: max-width of 100px.
*   `AGENTS.md` is updated to clarify the plan structure rules.
