# Progress

## Current State

OpenMD is at v1.2.0: OMD-009 (auto-refresh on save) is done. OMD-006 render
unit expansion is implemented with 13 new render-feature tests and a
title-escaping fix; host integration verification remains pending, so OMD-006
stays in_progress. In this sandbox, the render-only unit run passes 20 tests,
while the full unit command is blocked by the existing PreviewServer
`listen EPERM 127.0.0.1` restriction. Remaining queue: OMD-005, OMD-006 host
verification, plus publishing v1.1.0/v1.2.0 to the marketplaces (human approval
required).

## Feature index

| ID | Title | Status | Note |
|---|---|---|---|
| OMD-001 | Create project harness | done | [notes/OMD-001.md](notes/OMD-001.md) |
| OMD-002 | Core open-in-browser / open-in-preview commands | done | [notes/OMD-002.md](notes/OMD-002.md) |
| OMD-003 | Rich Markdown rendering | done | [notes/OMD-003.md](notes/OMD-003.md) |
| OMD-004 | Unified theme system | done | [notes/OMD-004.md](notes/OMD-004.md) |
| OMD-005 | v1.0.0: Mirror-path temp files and global cleanup | in_progress | [notes/OMD-005.md](notes/OMD-005.md) |
| OMD-006 | Automated test suite | in_progress | [notes/OMD-006.md](notes/OMD-006.md) |
| OMD-007 | Keep only the latest vsix in the repo | done | [notes/OMD-007.md](notes/OMD-007.md) |
| OMD-008 | Bundle with esbuild + full offline support | done | [notes/OMD-008.md](notes/OMD-008.md) |
| OMD-009 | Auto-refresh on save (preview panel + browser) | done | [notes/OMD-009.md](notes/OMD-009.md) |

## Cross-cutting decisions & events

- 2026-07-09 — Release convention: only the current release vsix is tracked in git (`.gitignore` `*.vsix` + `!openmd-<current>.vsix`); releasing means updating the exception and `git rm`-ing the previous vsix. Documented in CLAUDE.md/AGENTS.md (OMD-007).
- 2026-07-08 — Specs approved for OMD-008 (esbuild bundle + offline assets, unify duplicate HTML templates) and OMD-009 (auto-refresh via minimal localhost HTTP server) — OMD-008 must land first; OMD-009 changes browser preview from file:// to http://127.0.0.1.
- 2026-07-07 — Harness initialized via /init-harness: high autonomy, hooks gate publish/push, deletion, and network calls (docs/adr/0001-harness-init.md).
- 2026-02-11 — v0.1.6 lesson: .vscodeignore must not exclude node_modules — runtime deps ship inside the vsix; verify vsix contents before release.
- 2026-02-11 — Rendering pipeline standardized on markdown-it (migrated from marked in v0.1.0); Mermaid/hljs run client-side after window load because they come from CDN in the browser.
