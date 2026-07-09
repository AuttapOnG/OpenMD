# Spec: Expand the unit test suite

**Status:** approved
**Date:** 2026-07-09
**Feature:** OMD-006

## Goal
Grow automated coverage of the rendering pipeline from 12 to ~25 fast unit
tests (no VS Code host needed), and confirm the legacy integration suite
still runs.

## Background
`npm run test:unit` (mocha on compiled `out/`) currently covers offline asset
wiring, live-reload injection, and the `PreviewServer`. The markdown feature
set itself (task lists, anchors, attrs, emoji, alerts, UI scripts) has no
tests — regressions there were historically caught by hand (TESTING.md). A
3-test integration suite (`npm test`, @vscode/test-electron) exists from
v0.0.x; it downloads VS Code, so it can only be verified on the host, not in
a Codex sandbox.

## Requirements
- [ ] New `src/test/unit/render-features.test.ts` covering, via `generateHtml`
      output: task-list checkboxes, heading anchor links, markdown-it-attrs
      (`{#id .class}`), server-side emoji (`:rocket:` → 🚀), all five GitHub
      alert types, theme-toggle markup, copy-code-button script presence, and
      HTML-escaping of the page title
- [ ] All unit tests pass via `npm run test:unit` (~25 total)
- [ ] `npm test` (integration, 3 legacy tests) verified to run on the host —
      fixed if broken, but NOT expanded

## Out of Scope
- New integration tests (@vscode/test-electron) — revisit only if unit
  coverage proves insufficient
- Testing `computeMirrorHtmlPath` (imports `vscode`; not worth refactoring now)
- CI setup

## Success Criteria
- `npm run test:unit`: ~25 passing, 0 failing
- `npm test` completes successfully on the host machine
- Deliberately breaking a rendering feature (e.g. removing the task-lists
  plugin) makes at least one test fail

## Open Questions
- None
