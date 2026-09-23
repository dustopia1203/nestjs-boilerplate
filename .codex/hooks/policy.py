"""Guard explicit secret access and lint files edited through Codex patches."""
import json
from pathlib import Path
import re
import shlex
import subprocess
import sys

PATCH_PATH = re.compile(r"^\*\*\* (?:Add File|Update File|Delete File|Move to): (.+)$", re.M)
ENV_REFERENCE = re.compile(r"(?<![\w.])\.env(?:\.[\w.*?\[\]-]+)?(?![\w.])")
PATH_KEYS = {"path", "paths", "file_path", "file_paths", "filename"}
REVIEW_REMINDER = (
    "Before finishing changes under src/, invoke the architecture-reviewer subagent "
    "defined in .codex/agents/architecture-reviewer.toml once the implementation is ready. "
    "Address blocking findings before completion; do not spawn one reviewer per edit."
)


def secret_path(path):
    """Identify a local environment file without opening it."""
    return any(part != ".env.example" and (part == ".env" or part.startswith(".env."))
               for part in path.parts)


def input_paths(value):
    """Extract conventional file arguments from nested tool input."""
    if isinstance(value, dict):
        for key, item in value.items():
            if key in PATH_KEYS:
                for path in item if isinstance(item, list) else [item]:
                    if isinstance(path, str):
                        yield path
            elif isinstance(item, (dict, list)):
                yield from input_paths(item)
    elif isinstance(value, list):
        for item in value:
            yield from input_paths(item)


def deny(reason):
    """Return a blocking hook failure without echoing tool input."""
    print("Blocked: " + reason, file=sys.stderr)
    return 2


def shell_access_arguments(command):
    """Ignore explicit search exclusions and Git commit messages."""
    lexer = shlex.shlex(command, posix=True, punctuation_chars=";&|<>")
    lexer.whitespace_split = True
    tokens = list(lexer)
    arguments = []
    skip_next = False
    for index, token in enumerate(tokens):
        if skip_next:
            skip_next = False
            continue
        if token in {"-g", "--glob", "--iglob"} and index + 1 < len(tokens):
            if tokens[index + 1].startswith("!"):
                skip_next = True
                continue
        if token.startswith(("--glob=!", "--iglob=!", ":!", ":^", ":(exclude)")):
            continue
        if any(Path(item).name == "git" for item in tokens) and "commit" in tokens and token in {"-m", "--message"}:
            skip_next = True
            continue
        arguments.append(token)
    return arguments


def bypasses_gates(arguments):
    """Recognize common gate bypass arguments rather than prose mentions."""
    if any(token == "HUSKY=0" for token in arguments):
        return True
    if not any(Path(token).name == "git" for token in arguments):
        return False
    if any(token == "core.hooksPath" or token.startswith("core.hooksPath=") for token in arguments):
        return True
    return "commit" in arguments and any(
        token == "--no-verify" or re.fullmatch(r"-[A-Za-z]*n[A-Za-z]*", token)
        for token in arguments)


def guard(payload, cwd):
    """Reject explicit secret access and commit-gate bypasses."""
    tool = payload["tool_name"]
    arguments = payload["tool_input"]
    command = arguments.get("command", arguments.get("cmd", ""))
    paths = list(input_paths(arguments))
    if tool in {"apply_patch", "Edit", "Write"}:
        paths.extend(PATCH_PATH.findall(command))
        if any(Path(path).name == "bun.lock" for path in paths):
            return deny("bun.lock is generated; use bun add/remove/install.")
    elif tool in {"Bash", "exec_command", "shell", "shell_command"}:
        arguments = shell_access_arguments(command)
        if any(match.group() != ".env.example" for argument in arguments
               for match in ENV_REFERENCE.finditer(argument)):
            return deny("Do not read or modify local environment files; use .env.example.")
        if bypasses_gates(arguments):
            return deny("Do not bypass commit gates.")
        # Check literal shell arguments for aliases pointing at secret files.
        paths.extend(arguments)
    for value in paths:
        path = cwd / value
        if secret_path(path) or secret_path(path.resolve()):
            return deny("Do not read or modify local environment files; use .env.example.")
    return 0


def run_formatter(root, files):
    """Run both tools so formatting is applied even when lint fails."""
    commands = [
        [str(root / "node_modules/.bin/eslint"), "--fix", "--max-warnings=0", "--no-warn-ignored"],
        [str(root / "node_modules/.bin/prettier"), "--write", "--log-level=warn"],
    ]
    if any(not Path(command[0]).is_file() for command in commands):
        return deny("ESLint/Prettier are missing; run bun install before editing TypeScript.")
    failed = False
    for command in commands:
        result = subprocess.run(command + [str(file) for file in files], cwd=root,
                                stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
        if result.returncode:
            failed = True
            print(result.stdout, file=sys.stderr)
    return 2 if failed else 0


def lint_patch(payload, cwd):
    """Lint existing TypeScript patch targets inside the repository."""
    result = subprocess.run(["git", "-C", str(cwd), "rev-parse", "--show-toplevel"],
                            capture_output=True, text=True, check=True)
    root = Path(result.stdout.strip()).resolve()
    arguments = payload["tool_input"]
    paths = PATCH_PATH.findall(arguments.get("command", "")) + list(input_paths(arguments))
    files = []
    touches_source = False
    for value in paths:
        path = (cwd / value).resolve()
        if not path.is_relative_to(root) or secret_path(path):
            continue
        touches_source |= path.is_relative_to(root / "src")
        if path.suffix in {".ts", ".mts", ".cts"} and path.is_file() and path not in files:
            files.append(path)
    status = run_formatter(root, files) if files else 0
    if touches_source:
        print(json.dumps({"hookSpecificOutput": {
            "hookEventName": "PostToolUse", "additionalContext": REVIEW_REMINDER}}))
    return status


def main():
    """Process a single hook event from standard input."""
    try:
        payload = json.load(sys.stdin)
        if not isinstance(payload, dict) or not isinstance(payload.get("tool_input"), dict):
            raise ValueError("Invalid hook input")
        cwd = Path(payload["cwd"])
        if payload["hook_event_name"] == "PreToolUse":
            return guard(payload, cwd)
        if payload["hook_event_name"] == "PostToolUse":
            return lint_patch(payload, cwd)
        return 0
    except (ValueError, KeyError, TypeError, OSError, subprocess.SubprocessError):
        return deny("Hook could not validate this tool call; repair the hook/input before retrying.")


if __name__ == "__main__":
    sys.exit(main())
