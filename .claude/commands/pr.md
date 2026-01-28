# Pull Request

Create or update a pull request with changes.

## Instructions

Help the user create or update a pull request following project conventions.

### 1. Check current state

- Run `git status` to check for uncommitted changes
- Run `git branch --show-current` to get current branch name
- Run `gh pr view --json number,title,url 2>/dev/null` to check if a PR already exists for this branch

### 2. Determine workflow

**If on `main` branch with changes:** → New PR workflow (create branch first)
**If on feature branch with existing PR:** → Update PR workflow
**If on feature branch without PR:** → New PR workflow (skip branch creation)

---

## New PR Workflow

### 2a. Create branch (if on main)

- Ask user for a brief description of the changes (2-4 words)
- Determine branch type based on changes:
  - `feature/` - New functionality
  - `fix/` - Bug fixes
  - `refactor/` - Code refactoring
  - `docs/` - Documentation only
- Create branch: `git checkout -b <type>/<description>`

### 3a. Commit changes

- Run `git diff` to understand the changes
- Run `git log --oneline -5` to check commit message style
- Stage relevant files (prefer specific files over `git add -A`)
- Write a commit message:
  - Use imperative mood ("Add feature" not "Added feature")
  - First line: concise summary (under 72 chars)
  - Body: bullet points explaining key changes
  - **Never mention Claude or AI assistance**
- Commit the changes

### 4a. Push and create PR

- Run `git push -u origin <branch-name>`
- Use `gh pr create` with:
  - `--title`: Concise description of changes
  - `--body`: Markdown with:
    - `## Summary` - Bullet points of key changes
    - `## Test plan` - Checklist of manual testing steps

### 5a. Request review

- Add a comment: `gh pr comment <number> --body "@codex review"`
- Display the PR URL to the user

---

## Update PR Workflow

### 2b. Show existing PR info

- Display the existing PR number, title, and URL
- Run `git diff --stat` to show uncommitted changes

### 3b. Commit and push changes

- Stage relevant files
- Write a descriptive commit message for the new changes
- Commit and push: `git push`

### 4b. Optionally update PR description

Ask user if they want to update the PR description. If yes:

- Run `gh pr view --json body` to get current description
- Ask what to add/change
- Update with `gh pr edit <number> --body "<updated body>"`

### 5b. Optionally re-request review

Ask if they want to request another review. If yes:

- Add comment: `gh pr comment <number> --body "@codex review"`

### 6b. Confirm

- Show what was pushed
- Display the PR URL

---

## Branch naming examples

- `feature/add-dark-mode`
- `fix/quote-response-bug`
- `refactor/separate-tab-contexts`
- `docs/update-readme`

## Notes

- This is a public open-source repo - follow best practices
- Never include sensitive information in commits
- Pre-commit hooks will run automatically on commit
- When updating PRs, new commits are automatically added - no need to recreate
