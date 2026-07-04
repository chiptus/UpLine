# PR Shorthand

Create a pull request with a commitlint-compliant title, short 1–2 line description, and manual verification steps.

## Steps

1. **Stage and commit your changes** on the feature branch.
   - Run `git status` to review what you're committing.
   - Confirm all desired changes are staged; discard or stash anything not intended for this PR.

2. **Craft a commitlint-compliant title** in the form `<type>: <subject>`.
   - Valid `<type>`: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `ci`, `revert`.
   - `<subject>`: lowercase, imperative mood, no period. Under 50 characters total (e.g., `feat: add group invite notifications`).
   - This title becomes the PR title _and_ your commit message.

3. **Write a 1–2 line description**.
   - One sentence stating _what_ changed and _why_.
   - Optional second line: one concrete outcome or side effect users will see.
   - Do not repeat the title; assume the reader knows what the title says.
   - Examples:
     - `Adds group invite notifications so collaborators know when added to a group.`
     - `Fixes artist filtering by stage. Users can now see correct artist count per stage.`

4. **List manual verification steps** (3–5 bullet points).
   - Start with the golden path (happy case): "Load a group, invite a new member, verify notification arrives."
   - Add 1–2 edge cases: "Invite an already-member, invite a deleted user, verify appropriate error."
   - Each step is a testable action; don't write "should work" — write "open admin, click X, see Y appear."
   - Completion criterion: a reader unfamiliar with the code can follow these steps and see the change work.

5. **Create the pull request** using the CLI or web interface.
   - Title: your commitlint-compliant string from step 2.
   - Description body: 1–2 lines from step 3, followed by a `## Verification` section with your steps.
   - Example structure:
     ```
     Adds group invite notifications so users know when added to a group.

     ## Verification
     - Load a group and invite a new member; notification appears in 2 seconds.
     - Invite an already-member; error message "User already in group" shown.
     - Invite a deleted user; error message "User not found" shown.
     ```

6. **Paste or link the PR URL** so you have it for follow-up.
   - Completion criterion: PR is created and you can navigate to it.
