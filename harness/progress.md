# Progress

## Current State

All features OMD-001..013 + OMD-016 are done. v1.3.0 (KaTeX math +
footnotes, OMD-012) released 2026-07-10 via the CI pipeline (OMD-011:
tag push → GitHub Actions → Marketplace + Open VSX; tokens in repo
secrets, guide in docs/RELEASE.md). 2026-07-13 growth push: OMD-016
marketplace listing overhaul (demo GIF, metadata, comparison table —
goes live at the next release) and OMD-013 Windows audit (src/paths.ts
helpers, ci.yml ubuntu+windows matrix, both green on run 29219092930).
Codebase: esbuild bundle, full offline rendering (incl. vendored KaTeX
css/fonts), auto-refresh previews with no-store cache headers, 54 unit +
5 integration tests. 2026-07-13: OMD-017 cleanup
prefix-collision fixed (isOwnVersionedDir helper; first Codex-MCP
delegation), 60 unit tests green — fix ships with the next release.
2026-07-20: OMD-019 marketplace SEO (searchable displayName + 23
keywords) — metadata-only; and OMD-020 Export to HTML/PDF (Codex-executed,
host-verified: 71 unit tests + Playwright offline render + real print
dialog). Both go live at the next release.
Backlog (planned, spec needed): OMD-014 settings
(theme/port/auto-refresh).

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
| OMD-013 | Windows compatibility audit + CI test matrix | done | [notes/OMD-013.md](notes/OMD-013.md) |
| OMD-014 | Extension settings: theme, server port, auto-refresh toggle | planned | needs spec |
| OMD-016 | Marketplace listing overhaul (demo GIF + metadata + comparison table) | done | [notes/OMD-016.md](notes/OMD-016.md) |
| OMD-017 | Activation cleanup can match foreign extensions by ID prefix | done | [notes/OMD-017.md](notes/OMD-017.md) |
| OMD-018 | Code block theme mismatch (hljs css vs toggle) + stranded copy button | done | [notes/OMD-018.md](notes/OMD-018.md) |
| OMD-019 | Marketplace SEO: searchable displayName + expanded keywords | done | [notes/OMD-019.md](notes/OMD-019.md) |
| OMD-020 | Export to self-contained HTML + Export to PDF (browser print) | done | [notes/OMD-020.md](notes/OMD-020.md) |

## Cross-cutting decisions & events

- 2026-07-20 — OMD-020 Export to HTML/PDF shipped (feature complete, unreleased). Design brainstormed with owner: primary use "send to someone to view" → single self-contained HTML; PDF via browser print dialog (no engine bundled). Executed by Codex CLI (token openmd-omd020-export-x7q2, gpt-5.6-sol, ~107k tokens) task-by-task TDD; sandbox commits failed as usual → Claude committed on host (a898f49 render, d0cf8d2 commands, 15af646 manifest). Host verification: 71 unit tests green; real-asset self-containment check (plain export 176 KB / mermaid+math export 3.16 MB — conditional inlining confirmed); Playwright offline render (only the HTML file is fetched, mermaid+math+hljs render) and the real ?print=1 → native Save-as-PDF dialog. Design note: hljs (158 KB) inlined unconditionally per spec. Ships at next release (CHANGELOG/README bullet then).

- 2026-07-20 — Growth follow-on (OMD-019): marketplace SEO tweak — displayName `OpenMD` → `OpenMD — Markdown Preview in Browser` (VS Code weights displayName heavily in search), keywords 15 → 23 (pdf, print, readme, documentation, technical writing, cursor, windsurf, vscodium). Metadata-only; goes live at the next release. Strategy note: stop fighting the saturated "markdown preview" head term — rank for long-tail OpenMD wins (open-in-browser, mermaid offline, print-to-pdf). Remaining growth backlog stays in notes/OMD-016.md + OMD-019.md (first-500 installs flywheel, in-product rate nudge, HTML/PDF export moat).

- 2026-07-13 — v1.3.3 released (OMD-017 cleanup prefix-collision fix) via the OMD-011 pipeline, run 29238085337 green; GitHub Release created manually per the RELEASE.md checklist (now documented), vsix attached and verified. Node-20 deprecation annotations on checkout/setup-node still present — unscheduled chore.

- 2026-07-13 — OMD-015 (release workflow hardening) dropped by owner decision: the manual `gh release create` step is intentional — the owner wants to keep the current-version vsix in the repo and test locally before publishing the Release. The release.yml upload step stays best-effort (`|| true`); remember: no manual Release → no vsix attached. The bundled sub-item (bump deprecated actions/checkout + setup-node off Node 20) remains an unscheduled small chore, not a feature.
- 2026-07-13 — v1.3.1 released (Windows hardening OMD-013 + listing overhaul OMD-016) via the OMD-011 pipeline, run 29219587452 green. GitHub Release still created manually via gh (OMD-015 gap remains).
- 2026-07-13 — Growth push (OMD-016): marketplace listing overhauled (demo GIF, metadata, comparison table). Listing changes go live only at the next release. Remaining growth backlog lives in notes/OMD-016.md (reviews, launch posts, HTML/PDF export idea). GIF recording is repeatable without a human: standalone PreviewServer via node + Playwright + Pillow.

- 2026-07-10 — Release process is now CI-driven (OMD-011): bump+commit per the vsix convention, then `git tag vX.Y.Z` and push the tag — GitHub Actions publishes to VS Code Marketplace + Open VSX and attaches the vsix to the GitHub Release. Tokens live in repo secrets (VSCE_PAT expires 2026-11-30, all-orgs PATs die 2026-12-01); full guide incl. token reissue in docs/RELEASE.md. Do NOT run vsce/ovsx publish locally anymore. Marketplace takes ~5-10 min post-publish validation before the new version is visible.
- 2026-07-09 — Release convention: only the current release vsix is tracked in git (`.gitignore` `*.vsix` + `!openmd-<current>.vsix`); releasing means updating the exception and `git rm`-ing the previous vsix. Documented in CLAUDE.md/AGENTS.md (OMD-007).
- 2026-07-08 — Specs approved for OMD-008 (esbuild bundle + offline assets, unify duplicate HTML templates) and OMD-009 (auto-refresh via minimal localhost HTTP server) — OMD-008 must land first; OMD-009 changes browser preview from file:// to http://127.0.0.1.
- 2026-07-07 — Harness initialized via /init-harness: high autonomy, hooks gate publish/push, deletion, and network calls (docs/adr/0001-harness-init.md).
- 2026-02-11 — v0.1.6 lesson: .vscodeignore must not exclude node_modules — runtime deps ship inside the vsix; verify vsix contents before release.
- 2026-02-11 — Rendering pipeline standardized on markdown-it (migrated from marked in v0.1.0); Mermaid/hljs run client-side after window load because they come from CDN in the browser.
