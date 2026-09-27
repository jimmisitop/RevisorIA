# Review report compatibility implementation plan

**Goal:** Display the existing report evidence and checklist text in all three report views.
**Architecture:** A shared pure adapter maps legacy cached reports and structured reports to the existing UI contract at the server and client boundaries. No analysis content or severity is invented.
**Tech Stack:** TypeScript, React, Express, Node test runner.
**Spec:** User screenshots show blank findings and checklist rows after importing a PR.

## Constraints
- Preserve existing server edits and analysis-cache content.
- Do not publish reviews to GitHub.
- Unknown severity is explicitly unspecified; checklist resolution is session state only.

## Tasks
- [x] Add `shared/review-analysis.ts`: map category/message to title/description, strings to checklist objects, preserve explicit metadata and assign stable unique IDs.
- [x] Use `normalizeReviewAnalysis` at `pullRequestFromGithub` and all client report response boundaries, including reports from an already-running server.
- [x] Display unknown severity, remediation and file references; add empty states and visible action failures.
- [x] Implement checklist updates in the server's existing in-memory PR store; return 404 for missing reports/items.
- [x] Test every cached report, structured reports, missing fields, duplicate IDs and idempotence using Node assertions; compile both projects and inspect report UI with cached data.

