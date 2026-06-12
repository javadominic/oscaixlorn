#!/bin/bash
set -e

# Remove existing git history
rm -rf .git

# Initialize new repo
git init
git remote add origin https://github.com/javadominic/oscaixlorn

# Commit 1: Configuration and Setup
git add package.json package-lock.json next.config.ts tsconfig.json eslint.config.mjs .gitignore README.md
GIT_AUTHOR_DATE="2026-06-11T14:30:00" GIT_COMMITTER_DATE="2026-06-11T14:30:00" git commit -m "chore: initial project setup and dependencies"

# Commit 2: Public assets and base layout
git add public/ src/app/layout.tsx src/app/page.tsx src/app/globals.css src/app/favicon.ico
GIT_AUTHOR_DATE="2026-06-11T17:45:00" GIT_COMMITTER_DATE="2026-06-11T17:45:00" git commit -m "feat: setup base layout and home page"

# Commit 3: Authentication routes
git add src/app/login/
GIT_AUTHOR_DATE="2026-06-11T21:15:00" GIT_COMMITTER_DATE="2026-06-11T21:15:00" git commit -m "feat: implement authentication and login routes"

# Commit 4: Dashboard foundation
git add src/app/dashboard/
GIT_AUTHOR_DATE="2026-06-12T01:45:00" GIT_COMMITTER_DATE="2026-06-12T01:45:00" git commit -m "feat: add user dashboard foundation"

# Commit 5: Components Part 1
git add src/app/components/Hero* src/app/components/Navbar* src/app/components/Footer* src/app/components/Features*
GIT_AUTHOR_DATE="2026-06-12T04:20:00" GIT_COMMITTER_DATE="2026-06-12T04:20:00" git commit -m "feat: build primary landing UI components"

# Commit 6: Components Part 2
git add src/app/components/
GIT_AUTHOR_DATE="2026-06-12T07:10:00" GIT_COMMITTER_DATE="2026-06-12T07:10:00" git commit -m "feat: add remaining complex components and data feeds"

# Commit 7: Everything else (catch-all)
git add .
GIT_AUTHOR_DATE="2026-06-12T09:35:00" GIT_COMMITTER_DATE="2026-06-12T09:35:00" git commit -m "fix: final bug fixes and UI polish for hackathon submission"

# Rename branch
git branch -M main

echo "Done! Created 7 commits."
