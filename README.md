
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

Built by [team names] for the IBM Bob 2.0 Hackathon.
