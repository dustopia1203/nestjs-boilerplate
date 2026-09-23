#!/usr/bin/env bash
# PreToolUse (Edit|Write): block edits to local secrets and the generated
# lockfile. `.env.example` stays editable because it is the committed template.
set -uo pipefail

file=$(jq -r '.tool_input.file_path // empty')
name=$(basename -- "$file")

case "$name" in
  .env.example)
    exit 0
    ;;
  .env | .env.*)
    echo "Blocked: $name holds local secrets. Edit .env.example instead, or ask the user to change $name." >&2
    exit 2
    ;;
  bun.lock)
    echo "Blocked: bun.lock is generated. Use 'bun add' / 'bun remove' / 'bun install' instead." >&2
    exit 2
    ;;
esac
