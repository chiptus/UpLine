# Create PR

## Title

Format: `<type>(<scope>): <subject>`

**Type**: `feat`, `fix`, `refactor`, `perf`, `test`, `docs`, `style`, `ci`, `chore`, `revert`

**Scope**: Module/feature affected (e.g., `groups`, `voting`, `auth`, `filters`, `components`)

**Subject**: Lowercase, imperative mood, no period (e.g., `add invite notifications`)

## Description

1–2 lines. First line: what + why. Second line (optional): observable outcome. Don't repeat the title.

Example:
```
Adds group invite notifications so users know when added to a group.
Notification appears in sidebar within 2 seconds.
```

## Verification (if needed)

3–5 bullets: golden path, then edge cases. Write as testable actions, not assertions.

Example:
```
- Load a group and invite a new member; notification appears.
- Invite already-member; error shown.
- Invite deleted user; error shown.
```
