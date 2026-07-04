# Commitlint Reference

Quick guide to valid commit types and examples for UpLine.

## Commit Types

| Type | Use When | Example |
|------|----------|---------|
| `feat` | Adding a new feature | `feat: add group invite notifications` |
| `fix` | Fixing a bug | `fix: artist filtering by stage count` |
| `refactor` | Restructuring code without behavior change | `refactor: extract ArtistCard to separate file` |
| `perf` | Improving performance | `perf: memoize group members list` |
| `test` | Adding or updating tests | `test: add e2e test for vote submission` |
| `docs` | Documentation changes | `docs: update README testing section` |
| `style` | Code style (lint, formatting) | `style: format components with prettier` |
| `ci` | CI/CD configuration | `ci: add Playwright workflow step` |
| `chore` | Dependency updates, config | `chore: update TanStack Query to v5` |
| `revert` | Reverting a prior commit | `revert: remove experimental vote UI` |

## Title Rules

- **Format**: `<type>: <subject>`
- **Subject line**: 
  - Lowercase start (even if a name: `feat: add supabase integration`, not `feat: add Supabase Integration`)
  - Imperative mood: "add", "fix", "update" — not "adds", "fixed", "updated"
  - No period at the end
  - ~50 characters max (GitHub wraps longer titles)
- **Examples**:
  - ✅ `feat: add group invite notifications`
  - ✅ `fix: prevent duplicate votes on refresh`
  - ❌ `feat: adds group invite notifications` (not imperative)
  - ❌ `feat: add group invite notifications.` (period)
  - ❌ `feat: Add Group Invite Notifications` (not lowercase)

## PR Description Tips

- **Line 1**: One concise sentence covering _what_ + _why_.
- **Line 2** (optional): Observable outcome or user-facing effect.
- **Verification section**: 3–5 bullet points following the golden path + edge cases.
- **Avoid**: Repeating the title, vague phrasing ("should work"), assumptions about the reader's knowledge of the codebase.

## Example PR

**Title**: `feat: add group invite notifications`

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
