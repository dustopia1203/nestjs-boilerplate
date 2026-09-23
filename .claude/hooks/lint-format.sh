#!/usr/bin/env bash
# PostToolUse (Edit|Write): mirror lint-staged on the edited TypeScript file so
# JSDoc, OpenAPI, import-order and layer-boundary violations surface right away
# instead of at commit time. Exit 2 feeds ESLint's report back to Claude.
set -uo pipefail

file=$(jq -r '.tool_input.file_path // empty')

case "$file" in
  *.ts | *.mts | *.cts) ;;
  *) exit 0 ;;
esac

# Files outside the repo (e.g. scratchpad) are not covered by its ESLint config.
case "$file" in
  "$CLAUDE_PROJECT_DIR"/*) ;;
  *) exit 0 ;;
esac

[ -f "$file" ] || exit 0
cd "$CLAUDE_PROJECT_DIR" || exit 0

eslint_output=$(./node_modules/.bin/eslint --fix --max-warnings=0 --no-warn-ignored "$file" 2>&1)
eslint_status=$?

# Format even when lint fails so Claude sees the file in its final shape.
./node_modules/.bin/prettier --write --log-level=warn "$file" >&2

if [ "$eslint_status" -ne 0 ]; then
  printf 'ESLint failed for %s — fix before continuing:\n%s\n' "$file" "$eslint_output" >&2
  exit 2
fi
