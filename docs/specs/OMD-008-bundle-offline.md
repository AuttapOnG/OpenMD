# Spec: Bundle extension with esbuild + full offline support

**Status:** approved
**Date:** 2026-07-08
**Feature:** OMD-008

## Goal
Shrink the vsix from ~24 MB to ~2-3 MB by bundling with esbuild, and make all
rendering (Mermaid, syntax highlighting) work with no internet connection by
shipping assets locally instead of loading them from CDN.

## Background
The extension currently packages `node_modules` raw inside the vsix (~24 MB)
and the generated HTML loads highlight.js (JS + 2 CSS themes) from cdnjs and
mermaid from jsdelivr. Offline, code blocks lose highlighting and Mermaid
diagrams do not render at all. `src/extension.ts` (~1,265 lines) contains two
near-duplicate HTML templates (~500 lines each) for browser and webview modes.

## Requirements
- [ ] Build with esbuild: bundle `src/` into `dist/extension.js`; `package.json`
      `main` points to it; `.vscodeignore` excludes `node_modules/` and `src/`
- [ ] Copy `mermaid.min.js`, `highlight.min.js`, `github.min.css`,
      `github-dark.min.css` from node_modules into `media/` at build time
- [ ] On activate, copy `media/` assets into `.temp/assets/` — AFTER the
      v1.0.0 global temp cleanup runs (the cleanup deletes `.temp` for all
      versions including the current one, so ordering matters)
- [ ] Extract rendering into `src/render.ts` with a single
      `generateHtml(content, fileUri, mode: 'browser' | 'webview')` replacing
      both duplicate templates
- [ ] Browser mode references assets via absolute `file://` paths to
      `.temp/assets/`; webview mode uses `webview.asWebviewUri()` on `media/`
- [ ] No `http://` or `https://` URLs remain in generated HTML

## Out of Scope
- Auto-refresh / preview server (OMD-009)
- Changing the rendering pipeline or markdown-it plugins
- Removing the mirror-path temp-file system from v1.0.0

## Success Criteria
- `vsce package` produces a vsix ≤ 3 MB
- With networking disabled, "Open in Browser" and "Open in Preview" both render
  Mermaid diagrams and highlighted code correctly
- Installed extension activates and both commands work (guards against the
  v0.1.6 missing-node_modules regression)

## Open Questions
- None
