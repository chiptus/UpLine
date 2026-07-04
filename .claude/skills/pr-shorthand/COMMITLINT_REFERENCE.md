# Commitlint Reference

Quick guide to valid commit types and examples for UpLine.

## Commit Types

| Type | Use When | Example |
|------|----------|---------|
| `feat` | Adding a new feature | `feat(groups): add group invite notifications` |
| `fix` | Fixing a bug | `fix(voting): prevent duplicate votes on refresh` |
| `refactor` | Restructuring code without behavior change | `refactor(components): extract ArtistCard to separate file` |
| `perf` | Improving performance | `perf(filters): memoize group members list` |
| `test` | Adding or updating tests | `test(e2e): add vote submission flow` |
| `docs` | Documentation changes | `docs(readme): update testing section` |
| `style` | Code style (lint, formatting) | `style: format components with prettier` |
| `ci` | CI/CD configuration | `ci(github): add Playwright workflow step` |
| `chore` | Dependency updates, config | `chore(deps): update TanStack Query to v5` |
| `revert` | Reverting a prior commit | `revert: remove experimental vote UI` |

## Title Rules

- **Format**: `<type>(<scope>): <subject>`
  - `<type>`: required (see types above)
  - `<scope>`: optional but recommended; the module/feature affected (e.g., `groups`, `voting`, `auth`, `filters`, `components`)
  - `<subject>`: required
- **Subject line**: 
  - Lowercase start (even if a name: `feat: add supabase integration`, not `feat: add Supabase Integration`)
  - Imperative mood: "add", "fix", "update" — not "adds", "fixed", "updated"
  - No period at the end
  - ~50 characters max total (GitHub wraps longer titles)
- **Examples**:
  - ✅ `feat(groups): add group invite notifications`
  - ✅ `fix(voting): prevent duplicate votes on refresh`
  - ✅ `feat: add group invite notifications` (scope optional)
  - ❌ `feat(groups): adds group invite notifications` (not imperative)
  - ❌ `feat(groups): add group invite notifications.` (period)
  - ❌ `feat(Groups): add group invite notifications` (scope not capitalized)

## PR Description Tips

- **Line 1**: One concise sentence covering _what_ + _why_.
- **Line 2** (optional): Observable outcome or user-facing effect.
- **Verification section**: 3–5 bullet points following the golden path + edge cases.
- **Avoid**: Repeating the title, vague phrasing ("should work"), assumptions about the reader's knowledge of the codebase.

## Example PR

**Title**: `feat(groups): add invite notifications`

**Description**:
```
Adds group invite notifications so users know when a collaborator adds them to a group. 
Notification appears in the sidebar within 2 seconds.

## Verification
- Create a group, invite a new member; notification appears in their sidebar.
- Invite a user already in the group; error message "User already in group" shown.
- Invite a user with a deleted profile; error message "User not found" shown.
- Close and reopen the app; member is still in the group (persistence verified).
```
