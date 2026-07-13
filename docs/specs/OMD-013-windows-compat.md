# OMD-013 — Windows compatibility audit + CI test matrix

**Status:** review (awaiting human approval)
**Date:** 2026-07-13

## Problem

The extension has been developed and tested exclusively on macOS. Most
VS Code users are on Windows. Before promoting the extension (growth push,
OMD-016), we need confidence it works there — a broken first click becomes
a permanent 1-star review. There is currently **no CI on push/PR at all**
(only release.yml on tags), so nothing would catch a Windows regression.

## Scope

1. **Audit** all path/OS assumptions in `src/` and fix or explicitly
   justify each one. Known risk sites from a pre-scan:
   - `computeMirrorHtmlPath` (extension.ts:10-50): drive-letter segment
     (`C:`) in the no-workspace fallback (`fsPath.split(path.sep)` puts
     `C:` in pathParts); `HOME || USERPROFILE` fallback; project-marker
     match is lowercase-only while Windows paths are case-insensitive.
   - URL-path construction (extension.ts:176):
     `computeMirrorHtmlPath().split(path.sep).join('/')` — verify the
     result never contains `:` or backslashes on Windows, and that the
     registered page key matches what the browser requests after the
     server's `decodeURIComponent` (spaces, Thai characters).
   - Temp mirror-path write + activation cleanup (extension.ts:54-96):
     `.temp` staging, `copyFileSync`/`cpSync`, recursive delete of old
     versions' `.temp` dirs.
   - `server.ts`: `/assets/` handler splits URL on `'/'` then re-joins
     with `path.join` (looks correct — confirm with a test on Windows CI).
   - Unit/integration tests: any hardcoded `/`-separated fixture paths
     that would fail on `windows-latest`.
2. **New CI workflow** `.github/workflows/ci.yml`:
   - Triggers: push to main + pull_request.
   - Matrix: `ubuntu-latest`, `windows-latest` (macOS covered by local dev).
   - Steps: checkout, setup-node (non-deprecated versions — do NOT copy
     the Node20-deprecated pins from release.yml; that fix for release.yml
     itself stays in OMD-015), `npm ci`, `npm run compile`,
     `npm run test:unit`.
3. **Out of scope:** running the VS Code integration suite on Windows CI
   (needs display server setup — defer); release.yml changes (OMD-015);
   any new user-facing behavior.

## Approach

TDD where possible: for each audit finding, first add a unit test that
encodes the Windows behavior (path logic in extension.ts is not currently
unit-testable — extract pure helpers into a new `src/paths.ts` with no
vscode imports so they CAN be tested, mirroring the server.ts pattern),
then fix. `path.win32`/`path.posix` let Windows semantics be tested from
macOS; the CI matrix then proves it on real Windows.

## Execution

Codex CLI executes the plan (per the OMD-012 pattern); Claude writes the
plan, reviews the diff, verifies on host, commits. Sandbox constraints
apply (no network, no .git writes, no port binding).

## Acceptance criteria

- Audit findings table in harness/notes/OMD-013.md: every site listed
  above (plus anything else found) marked fixed or justified.
- Path helpers extracted to `src/paths.ts` (no vscode imports) with unit
  tests covering Windows-style paths (drive letters, backslashes,
  USERPROFILE) via `path.win32` injection.
- `.github/workflows/ci.yml` runs compile + unit tests on ubuntu-latest
  and windows-latest for pushes/PRs.
- All tests green locally (macOS) AND on windows-latest in CI.
  **Note:** the CI proof requires a push (human-gated) — the feature
  stays in_progress until that run is green.
- `npm run compile`, full unit suite, and `vsce ls` pass; no behavior
  change on macOS (existing 38 tests still pass unmodified or with
  justified updates).
