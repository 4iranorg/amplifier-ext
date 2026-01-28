# Create Pull Request

Create a feature branch, commit changes, push, and open a pull request.

## Instructions

Help the user create a pull request following project conventions. Follow these steps:

### 1. Check prerequisites

- Run `git status` to check for uncommitted changes
- If there are no changes, inform the user and stop
- Run `git diff --stat` to show what files are modified

### 2. Create branch

- Ask user for a brief description of the changes (2-4 words)
- Determine branch type based on changes:
  - `feature/` - New functionality
  - `fix/` - Bug fixes
  - `refactor/` - Code refactoring
  - `docs/` - Documentation only
- Create branch name using kebab-case: `<type>/<description>`
- Run `git checkout -b <branch-name>`

### 3. Commit changes

- Run `git diff` to understand the changes
- Run `git log --oneline -5` to check commit message style
- Stage relevant files (prefer specific files over `git add -A`)
- Write a commit message following project conventions:
  - Use imperative mood ("Add feature" not "Added feature")
  - First line: concise summary (under 72 chars)
  - Body: bullet points explaining key changes
  - **Never mention Claude or AI assistance**
- Commit the changes

### 4. Push to remote

- Run `git push -u origin <branch-name>`

### 5. Create pull request

- Use `gh pr create` with:
  - `--title`: Concise description of changes
  - `--body`: Markdown with:
    - `## Summary` - Bullet points of key changes
    - `## Test plan` - Checklist of manual testing steps
- Store the PR URL from the output

### 6. Request review

- Add a comment to the PR: `gh pr comment <number> --body "@codex review"`

### 7. Confirm

- Display the PR URL to the user
- Remind them to monitor for review feedback

## Branch naming examples

- `feature/add-dark-mode`
- `fix/quote-response-bug`
- `refactor/separate-tab-contexts`
- `docs/update-readme`

## Notes

- This is a public open-source repo - follow best practices
- Never include sensitive information in commits
- Pre-commit hooks will run automatically on commit
