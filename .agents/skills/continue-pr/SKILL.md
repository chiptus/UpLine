---
name: continue-pr
description: "Resume work on an existing PR branch — an issue is already in progress with an open PR, and the ask is to pick it back up rather than start fresh. Use when the user gives a branch + PR and says to continue, keep working, or work on the PR (not a new branch)."
allowed-tools: Bash(git fetch:*), Bash(git checkout:*), Bash(git status:*), Bash(git diff:*), Bash(git log:*), Bash(git push:*), github__pull_request_read, github__add_reply_to_pull_request_comment, github__resolve_review_thread
---

# Continue PR

Pick up an in-progress PR rather than starting over. Checkout the named branch — never create a new one — and fetch the PR to ground the rest of the work.

1. **Checkout the existing branch.** `git fetch origin <branch>` then `git checkout <branch>`. If the PR is already merged, this is fresh work instead: restart the branch from the base branch's tip (see CLAUDE.md's merged-PR rule) rather than stacking on merged history.

2. **Read the PR, not just the issue.** Fetch the PR body, diff stat, and review comments. The PR body says what's already done; unresolved review comments are the real remaining work list — treat each one as a task, not a suggestion to skim.

3. **Diff the issue's acceptance criteria against what's already on the branch.** Some criteria may already be met by existing commits — verify each one against the actual code, don't assume unchecked means undone.

4. **Do the remaining work.** Typecheck, run the relevant tests, and close any gap found in steps 2-3.

5. **Reply to review comments you addressed**, and resolve their threads. If a comment is already satisfied by existing code, say so and resolve it rather than re-doing the work.

6. **Commit and push to the same branch** (`git push -u origin <branch>`). Don't open a new PR — the existing one tracks this branch.
