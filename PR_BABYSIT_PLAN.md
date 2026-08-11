# PR #37 babysit plan

## Objective
Drive Bloom-Invest/bloom-tests#37 to merge-ready without merging it.

## Steps
1. Verify live PR state, duplicate-card status, CI, all review sources, and scope at the live head.
2. Use an isolated worktree pinned to the PR branch; reproduce and minimally fix any live finding or CI failure with a targeted test.
3. Commit and push only explicit paths to the PR branch; reply to and resolve addressed threads.
4. Re-check the new head for CI, fresh review threads, clean scope/diff, and plan completion.

## Acceptance criteria
- PR remains open and unmerged.
- All reported CI checks are green (or no checks are reported), all actionable review threads are resolved, and the diff is scoped.
- Verification evidence and plan-vs-actual status are recorded in the Kanban completion.
