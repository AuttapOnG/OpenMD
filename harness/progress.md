# Progress

## Current State

All features OMD-001..012 are done. v1.3.0 (KaTeX math + footnotes,
OMD-012) released 2026-07-10 via the CI pipeline (OMD-011: tag push →
GitHub Actions → Marketplace + Open VSX; tokens in repo secrets, guide
in docs/RELEASE.md). Codebase: esbuild bundle, full offline rendering
(incl. vendored KaTeX css/fonts), auto-refresh previews with no-store
cache headers, 38 unit + 5 integration tests. Backlog (all planned, specs
needed): OMD-013 Windows compatibility audit + CI matrix, OMD-014
settings (theme/port/auto-refresh), OMD-015 release workflow hardening.

## Feature index

| ID | Title | Status | Note |
|---|---|---|---|
| OMD-001 | Create project harness | done | [notes/OMD-001.md](notes/OMD-001.md) |
| OMD-002 | Core open-in-browser / open-in-preview commands | done | [notes/OMD-002.md](notes/OMD-002.md) |
| OMD-003 | Rich Markdown rendering | done | [notes/OMD-003.md](notes/OMD-003.md) |
| OMD-004 | Unified theme system | done | [notes/OMD-004.md](notes/OMD-004.md) |
| OMD-005 | v1.0.0: Mirror-path temp files and global cleanup | done | [notes/OMD-005.md](notes/OMD-005.md) |
| OMD-006 | Automated test suite | done | [notes/OMD-006.md](notes/OMD-006.md) |
| OMD-007 | Keep only the latest vsix in the repo | done | [notes/OMD-007.md](notes/OMD-007.md) |
| OMD-008 | Bundle with esbuild + full offline support | done | [notes/OMD-008.md](notes/OMD-008.md) |
| OMD-009 | Auto-refresh on save (preview panel + browser) | done | [notes/OMD-009.md](notes/OMD-009.md) |
| OMD-010 | Cache-Control: no-store on preview server dynamic responses | done | [notes/OMD-010.md](notes/OMD-010.md) |
| OMD-011 | CI release pipeline (GitHub Actions publish on tag) | done | [notes/OMD-011.md](notes/OMD-011.md) |
| OMD-012 | Math rendering (KaTeX) + footnotes — offline, server-side | done | [notes/OMD-012.md](notes/OMD-012.md) |
| OMD-013 | Windows compatibility audit + CI test matrix | planned | needs spec |
| OMD-014 | Extension settings: theme, server port, auto-refresh toggle | planned | needs spec |
| OMD-015 | Release workflow hardening (CI creates Release, un-deprecate actions) | planned | found during v1.3.0 release |

## Cross-cutting decisions & events

- 2026-07-10 — Release process is now CI-driven (OMD-011): bump+commit per the vsix convention, then `git tag vX.Y.Z` and push the tag — GitHub Actions publishes to VS Code Marketplace + Open VSX and attaches the vsix to the GitHub Release. Tokens live in repo secrets (VSCE_PAT expires 2026-11-30, all-orgs PATs die 2026-12-01); full guide incl. token reissue in docs/RELEASE.md. Do NOT run vsce/ovsx publish locally anymore. Marketplace takes ~5-10 min post-publish validation before the new version is visible.
- 2026-07-09 — Release convention: only the current release vsix is tracked in git (`.gitignore` `*.vsix` + `!openmd-<current>.vsix`); releasing means updating the exception and `git rm`-ing the previous vsix. Documented in CLAUDE.md/AGENTS.md (OMD-007).
- 2026-07-08 — Specs approved for OMD-008 (esbuild bundle + offline assets, unify duplicate HTML templates) and OMD-009 (auto-refresh via minimal localhost HTTP server) — OMD-008 must land first; OMD-009 changes browser preview from file:// to http://127.0.0.1.
- 2026-07-07 — Harness initialized via /init-harness: high autonomy, hooks gate publish/push, deletion, and network calls (docs/adr/0001-harness-init.md).
- 2026-02-11 — v0.1.6 lesson: .vscodeignore must not exclude node_modules — runtime deps ship inside the vsix; verify vsix contents before release.
- 2026-02-11 — Rendering pipeline standardized on markdown-it (migrated from marked in v0.1.0); Mermaid/hljs run client-side after window load because they come from CDN in the browser.
