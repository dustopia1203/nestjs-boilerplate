"""Test synthetic hook events without accessing local secrets."""
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

SCRIPT = Path(__file__).with_name("policy.py")
REPO = Path.cwd()


class HookTests(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        self.root = Path(temporary.name).resolve()
        subprocess.run(["git", "init", "-q", str(self.root)], check=True)
        (self.root / "src").mkdir()

    def hook(self, tool, arguments, event="PreToolUse", cwd=None):
        payload = {"hook_event_name": event, "cwd": str(cwd or self.root),
                   "tool_name": tool, "tool_input": arguments}
        return subprocess.run([sys.executable, "-B", str(SCRIPT)],
                              input=json.dumps(payload), text=True, capture_output=True)

    def test_blocks_secret_reads(self):
        for command in ["cat .env", "cat nested/.env.local", "cat '.env.production'",
                        "cat .env.*", "source .env", 'python3 -c "open(\'.env\').read()"']:
            with self.subTest(command=command):
                self.assertEqual(self.hook("Bash", {"command": command}).returncode, 2)

    def test_blocks_file_tools_and_symlinks(self):
        (self.root / "alias").symlink_to(self.root / ".env")
        for path in [".env", "nested/.env.local", "alias"]:
            self.assertEqual(self.hook("mcp__fs__read_file", {"path": path}).returncode, 2)
        self.assertEqual(self.hook("Bash", {"command": "cat alias"}).returncode, 2)

    def test_allows_template_and_source_reads(self):
        for command in ["cat .env.example", "cat src/main.ts", "bun run test", "git status --short"]:
            self.assertEqual(self.hook("Bash", {"command": command}).returncode, 0)

    def test_protects_patch_paths_including_rename(self):
        for header in ["*** Add File: .env", "*** Update File: .env.local",
                       "*** Delete File: .env", "*** Move to: .env.production",
                       "*** Update File: bun.lock"]:
            patch = "*** Begin Patch\n*** Update File: src/main.ts\n" + header + "\n*** End Patch"
            self.assertEqual(self.hook("apply_patch", {"command": patch}).returncode, 2)

    def test_allows_env_mentions_in_patch_contents(self):
        patch = "*** Update File: src/main.ts\n+// .env is private"
        self.assertEqual(self.hook("apply_patch", {"command": patch}).returncode, 0)

    def test_blocks_gate_bypasses(self):
        for command in ["git commit --no-verify", 'git commit -am "x" -n',
                        "HUSKY=0 git commit", "git -c core.hooksPath=/tmp commit",
                        "git commit --no-verify; true", "/usr/bin/git commit --no-verify",
                        "git config core.hooksPath /tmp"]:
            self.assertEqual(self.hook("Bash", {"command": command}).returncode, 2)

    def test_allows_secret_exclusions_in_searches_and_diffs(self):
        for command in ["rg --hidden --glob '!.env' --glob '!.env.*' TODO .",
                        "rg -g '!.env' -g '!.env.*' TODO .",
                        "rg --glob=!.env --glob=!.env.* TODO .",
                        "git diff -- . ':!.env' ':!.env.*'",
                        "git diff -- . ':(exclude)**/.env' ':(exclude)**/.env.*'"]:
            with self.subTest(command=command):
                self.assertEqual(self.hook("Bash", {"command": command}).returncode, 0)

    def test_allows_discussing_gate_bypass(self):
        for command in ["rg -- '--no-verify' AGENTS.md",
                        "git commit -m 'chore: document --no-verify policy'",
                        "git commit -m '--no-verify'"]:
            self.assertEqual(self.hook("Bash", {"command": command}).returncode, 0)

    def test_exclusions_do_not_hide_explicit_secret_reads(self):
        result = self.hook("Bash", {"command": "rg -g '!.env' TODO .; cat .env"})
        self.assertEqual(result.returncode, 2)

    def test_invalid_input_shape_is_blocked(self):
        self.assertEqual(self.hook("Bash", None).returncode, 2)

    def install_tools(self):
        (self.root / "node_modules").symlink_to(REPO / "node_modules", target_is_directory=True)
        (self.root / "eslint.config.mjs").write_text(
            'export default [{files: ["**/*.ts", "**/*.mts"], rules: {"no-debugger": "error"}}];\n')

    def test_formats_multiple_files_from_subdirectory(self):
        self.install_tools()
        for name in ["one.ts", "two space.mts"]:
            (self.root / "src" / name).write_text("export const value=1\n")
        patch = "*** Add File: one.ts\n*** Update File: old.mts\n*** Move to: two space.mts"
        result = self.hook("apply_patch", {"command": patch}, "PostToolUse", self.root / "src")
        self.assertEqual(result.returncode, 0, result.stderr)
        for name in ["one.ts", "two space.mts"]:
            self.assertEqual((self.root / "src" / name).read_text(), "export const value = 1;\n")
        self.assertIn("architecture-reviewer", result.stdout)

    def test_lint_error_still_formats(self):
        self.install_tools()
        file = self.root / "src" / "bad.ts"
        file.write_text("debugger\nexport const value=1\n")
        result = self.hook("apply_patch", {"command": "*** Update File: src/bad.ts"}, "PostToolUse")
        self.assertEqual(result.returncode, 2)
        self.assertIn("no-debugger", result.stderr)
        self.assertIn("value = 1;", file.read_text())

    def test_missing_dependencies_fail_loudly(self):
        (self.root / "src" / "new.ts").write_text("export const value=1\n")
        result = self.hook("apply_patch", {"command": "*** Add File: src/new.ts"}, "PostToolUse")
        self.assertEqual(result.returncode, 2)
        self.assertIn("bun install", result.stderr)

    def test_deleted_and_outside_files_are_skipped(self):
        with tempfile.TemporaryDirectory() as outside:
            file = Path(outside) / "outside.ts"
            file.write_text("export const value=1\n")
            patch = f"*** Delete File: src/deleted.ts\n*** Update File: {file}"
            result = self.hook("apply_patch", {"command": patch}, "PostToolUse")
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertEqual(file.read_text(), "export const value=1\n")

    def test_malformed_input_is_blocked(self):
        result = subprocess.run([sys.executable, "-B", str(SCRIPT)], input="{", text=True, capture_output=True)
        self.assertEqual(result.returncode, 2)


if __name__ == "__main__":
    unittest.main()
