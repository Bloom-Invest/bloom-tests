# PR #36 babysit plan

## Objective
Drive Bloom-Invest/bloom-tests#36 (`fix/claude-review-agent-mode`) to merge-ready without merging it.

## Steps
1. Verify live PR state, CI, review bodies/comments, and review threads; identify only findings still live at the current head.
2. Use an isolated PR worktree under `~/projects/_worktrees`, aligned exactly to the live head; inspect the diff and relevant workflow/test configuration.
3. For each verified blocker, add a focused regression test, implement the minimal fix, run relevant verification, commit explicitly, and push the PR branch.
4. Reply to and resolve every addressed review thread, then re-query all review sources after any push.
5. Recheck live head, CI, mergeability, and plan completion; complete the board card if green and thread-clean.

## Acceptance criteria
- PR remains open, clean, and mergeable.
- All reported/required CI checks pass.
- No unresolved actionable review threads or review/comment findings remain for the live head.
- Any fixes are committed and pushed to the PR branch with targeted verification recorded.
