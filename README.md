# RevisorIA — AI Code Review Copilot

RevisorIA analyzes Pull Requests and flags risk, missing tests, and security
issues in seconds — built for the **IBM Bob 2.0 Hackathon**.

## The problem

Reviewing a Pull Request today means reading through every changed line by
hand, checking whether tests were added, hunting for security issues that
aren't obvious at a glance, and guessing how risky the change really is.
It's slow, error-prone, and depends entirely on the reviewer's attention and
experience — a problem every dev team runs into, regardless of size.

## The solution

RevisorIA takes a Pull Request and returns a clear report in seconds:

- A **risk score** (Low / Medium / High)
- Concrete **findings** across security, test coverage, and documentation
- An actionable **checklist** of what to fix before merging

## How IBM Bob 2.0 was used

The analysis engine is built around three specialized IBM Bob 2.0 Modes,
each with its own scope and instructions:

- **Security** — scans for hardcoded credentials, unvalidated input, and
  unsafe dependency usage.
- **Tests** — checks whether changed code has corresponding test coverage.
- **Documentation** — checks whether the README/docs still reflect the
  actual state of the code.

These three subagents are launched **in parallel** from an orchestrator Mode
(Agent Mode, with the Subagent tool enabled), instead of running one after
another — cutting a review that would take a person 20–30 minutes down to
seconds. Bob's document understanding is also used to read a PR's README
during review.

Bob was run manually inside its IDE against a small sample repository
([`revisoria-sample-app`](https://github.com/jimmisitop/revisoria-sample-app))
with three prepared Pull Requests, one for each risk level. All three
results were **real, unscripted analysis** — Bob surfaced issues we hadn't
explicitly planted, including a genuine `ReferenceError` bug in one of the
demo PRs.

## Architecture

- The backend fetches real PR data from the GitHub REST API.
- Analysis results are served from a **pre-generated cache**
  (`server/src/analysis-cache.json`), built by manually running Bob's three
  subagents on the sample PRs above. This keeps the full flow — GitHub →
  backend → AI result → frontend — genuinely working end to end, without
  incurring live API costs on every demo run.
- The analysis entry point (`analyzePullRequest()`) is provider-agnostic:
  it checks the cache first, and falls back to `callLiveAIProvider()` — a
  placeholder any team can fill in to connect a live AI provider (Bob, Jev,
  or otherwise) without touching the rest of the system.
- The original direct integration with Bob's CLI (`analyzeWithBob()`) is
  kept in the codebase, disconnected, as a reference implementation of how
  a live connection would work.

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite) |
| Backend | Node.js + Express |
| AI analysis | IBM Bob 2.0 (Security / Tests / Documentation subagents) |
| Source data | GitHub REST API |

## Running locally

```bash
# Backend
cd server
pnpm install
pnpm run dev

# Frontend
cd client
pnpm install
pnpm run dev
```

The backend expects a `.env` file (see `.env.example`) with a `GITHUB_TOKEN`
for higher API rate limits. No AI provider credentials are required to run
the cached demo flow.

## Security

No credentials are committed to this repository. `.env` and `.bobignore`
are excluded from version control — see `SECURITY.md` for details.

## Team

Built by jimmisitop and Vinay Sikarwar for the IBM Bob 2.0 Hackathon.
