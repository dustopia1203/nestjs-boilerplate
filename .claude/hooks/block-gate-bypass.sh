#!/usr/bin/env bash
# PreToolUse (Bash): block commands that skip the Husky gates (lint-staged,
# commitlint) described in AGENTS.md "Project-specific hard gates".
set -uo pipefail

cmd=$(jq -r '.tool_input.command // empty')

block() {
  echo "Blocked: $1 bypasses the AGENTS.md commit gates. Fix the failing check instead; only the user may bypass." >&2
  exit 2
}

if printf '%s' "$cmd" | grep -Eq -- '--no-verify'; then
  block '--no-verify'
fi

# `git commit -n` (alone or clustered, e.g. `-an`) is the short form of --no-verify.
if printf '%s' "$cmd" | grep -Eq -- 'git([[:space:]]+[^[:space:];&|]+)*[[:space:]]+commit([[:space:]]+[^;&|]*)?[[:space:]]-[A-Za-z]*n[A-Za-z]*([[:space:]]|$)'; then
  block 'git commit -n'
fi

if printf '%s' "$cmd" | grep -Eq -- '(^|[[:space:]])HUSKY=0'; then
  block 'HUSKY=0'
fi

if printf '%s' "$cmd" | grep -Eq -- 'core\.hooksPath'; then
  block 'overriding core.hooksPath'
fi
