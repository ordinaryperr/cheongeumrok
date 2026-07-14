#!/usr/bin/env bash
set -euo pipefail

MESSAGE="${1:-Update Cheongeumrok}"

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Error: this is not a git repository."
  exit 1
fi

echo "1/4 Running production build..."
npm run build

echo "2/4 Checking changes..."
if git diff --quiet && git diff --cached --quiet && [ -z "$(git ls-files --others --exclude-standard)" ]; then
  echo "No changes to commit."
  exit 0
fi

echo "3/4 Committing changes..."
git add -A
git commit -m "$MESSAGE"

echo "4/4 Pushing to GitHub..."
git push

echo "Done. Vercel will redeploy automatically."
