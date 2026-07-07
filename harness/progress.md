# Progress

## Current State

OpenMD is at v1.0.0 (uncommitted): the mirror-path temp-file + global-cleanup
work (OMD-005) is coded and packaged as openmd-1.0.0.vsix but not yet committed
or published. Next: finish OMD-005 (commit + publish with human approval), then
OMD-006 (automated tests).

## Feature index

| ID | Title | Status | Note |
|---|---|---|---|
| OMD-001 | Create project harness | done | [notes/OMD-001.md](notes/OMD-001.md) |
| OMD-002 | Core open-in-browser / open-in-preview commands | done | [notes/OMD-002.md](notes/OMD-002.md) |
| OMD-003 | Rich Markdown rendering | done | [notes/OMD-003.md](notes/OMD-003.md) |
| OMD-004 | Unified theme system | done | [notes/OMD-004.md](notes/OMD-004.md) |
| OMD-005 | v1.0.0: Mirror-path temp files and global cleanup | in_progress | [notes/OMD-005.md](notes/OMD-005.md) |
| OMD-006 | Automated test suite | pending | [notes/OMD-006.md](notes/OMD-006.md) |
| OMD-007 | Slim the repository (drop committed .vsix artifacts) | pending | [notes/OMD-007.md](notes/OMD-007.md) |

## Cross-cutting decisions & events

- 2026-07-07 — Harness initialized via /init-harness: high autonomy, hooks gate publish/push, deletion, and network calls (docs/adr/0001-harness-init.md).
- 2026-02-11 — v0.1.6 lesson: .vscodeignore must not exclude node_modules — runtime deps ship inside the vsix; verify vsix contents before release.
- 2026-02-11 — Rendering pipeline standardized on markdown-it (migrated from marked in v0.1.0); Mermaid/hljs run client-side after window load because they come from CDN in the browser.
