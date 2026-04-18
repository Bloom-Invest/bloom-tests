# bloom-tests

E2E tests for Bloom — powered by [Stably Agent 2.0](https://stably.ai) and Playwright.

## Setup

```bash
bun install                          # repo uses bun.lock as source of truth
npx playwright install chromium
```

> **Stably CLI gotcha:** the `stably` binary auto-detects the package manager and
> currently doesn't recognize `bun`. If you see `Playwright installation not found.
> Could not determine your package manager`, run `npm install` once in addition to
> `bun install` to give the CLI an `npm`-shaped layout. `package-lock.json` is
> gitignored so this won't pollute commits.

Set environment variables:
```bash
export STABLY_API_KEY="your_key_here"
export STABLY_PROJECT_ID="cmddjs2fq0000l70473vyhuwf"
export BASE_URL="https://app.getbloom.app"  # or your staging URL
```

## Running tests

```bash
bun test                  # Run all tests via Stably (bun maps to "stably test")
bun run test:headed       # Run with browser visible
```

## Generating new tests

```bash
bun run create "describe what to test in plain English"
```

## Auto-fixing failures

```bash
bun run fix               # Auto-detect last run and fix failures
```

## Auto-merging Stably autofix PRs

When `stably fix` opens a PR (branch prefix `fix/stably-autofix-*`,
`stably/autofix/*`, or `stably-session-*`), the
`.github/workflows/auto-merge-stably-fix.yml` workflow enables GitHub auto-merge
on it. The PR will squash-merge automatically once all required status checks
pass — no human babysitting needed for green autofix runs. Reviewers can still
block with a `Request changes` review.

## Migrating Classic tests

Use the Stably dashboard: Settings → Migrate → "Migrate Classic Tests"

## Stably Dashboard

https://app.stably.ai/project/cmddjs2fq0000l70473vyhuwf
