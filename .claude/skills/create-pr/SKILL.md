---
description: Create a pull request with a commitlint-compliant title, a 1-2 line description, and manual verification steps. Use when the user asks to open, create, or raise a PR.
allowed-tools: Bash(git *)
---

# Create PR

Create a pull request for the current branch. Produce all three parts below. Do not open the PR until each part meets its rule.

## 1. Title — required

Format: `<type>(<scope>): <subject>`

- **Type**: one of `feat`, `fix`, `refactor`, `perf`, `test`, `docs`, `style`, `ci`, `chore`, `revert`.
- **Scope**: the module/feature affected (e.g., `groups`, `voting`, `auth`, `filters`, `components`). Include it.
- **Subject**: lowercase, imperative mood, no period.

Reject the title if it lacks a valid type, lacks a scope, or exceeds ~50 characters. Example: `feat(groups): add invite notifications`.

## 2. Description — required, keep it short

Aim for one or two lines. First line: what changed + why. Optional second line: one observable outcome. Don't repeat the title, and don't pad it into a full body with headings or bullet lists.

```
Adds group invite notifications so users know when added to a group.
Notification appears in sidebar within 2 seconds.
```

## 3. Verification — required

List a few bullets — the golden path first, then edge cases. Each bullet is a testable action a reviewer can perform, not an assertion that it works. Put them under a `## Verification` heading in the PR body.

Only omit this section if the diff has no runtime behavior to exercise (pure docs, config, or comment changes). If you omit it, say why in the description.

```
## Verification
- Load a group and invite a new member; notification appears.
- Invite already-member; error shown.
- Invite deleted user; error shown.
```

## Before opening

Confirm the branch is pushed, then create the PR with the title from step 1 and a body containing the description (step 2) followed by the Verification section (step 3).
