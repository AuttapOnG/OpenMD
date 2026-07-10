# OMD-012: Math rendering (KaTeX) + footnotes — offline, server-side

**Status:** review
**Date:** 2026-07-10

## Goal
Render TeX math (`$...$` inline, `$$...$$` block) and Markdown footnotes in
both preview surfaces (browser + webview panel), fully offline, rendered
server-side in Node.

## Background
OpenMD already ships task lists, GitHub alerts, emoji, and anchors
(`src/render.ts`). The remaining gaps chosen for this feature are math and
footnotes. Constraints inherited from the project:
- **Offline-first (OMD-008):** no CDN requests, ever. All assets vendored in
  `media/` and shipped inside the vsix.
- **Windows-ready:** all new code must be path-safe (`path.join` /
  `vscode.Uri`, no hardcoded `/` in filesystem paths). URL paths served over
  HTTP always use `/`. A full Windows audit of existing code is OMD-013,
  but nothing added here may create new POSIX assumptions.

Rendering approach: **server-side KaTeX**. The markdown-it pipeline renders
math to HTML at conversion time in Node (no katex.js shipped to the
browser). The client only needs `katex.min.css` + woff2 fonts. This avoids
flash-of-unrendered-math and keeps the browser payload small.

## Requirements
- [ ] `$...$` renders inline math; `$$...$$` renders display (block) math,
      via a markdown-it plugin using the KaTeX engine (e.g.
      `markdown-it-texmath` + `katex` deps).
- [ ] Plain-text dollar signs are NOT parsed as math (e.g. "ราคา $5 กับ $10"
      stays literal). Escaped `\$` stays literal.
- [ ] Invalid TeX renders as a visible error fragment (KaTeX
      `throwOnError: false`), never crashes the render pipeline.
- [ ] Footnotes via `markdown-it-footnote`: `[^1]` references, definitions,
      back-links (↩), styled to match the existing GitHub-like theme in both
      light and dark modes.
- [ ] KaTeX assets vendored: `media/katex/katex.min.css` +
      `media/katex/fonts/*.woff2` (woff2 only — skip ttf/woff to keep the
      vsix small). Directory structure preserved so the CSS's relative
      `url(fonts/...)` references resolve on all three asset surfaces:
      1. browser: served by `PreviewServer` under `/assets/katex/...`
         (extend the whitelist to allow the `katex/` subtree with an
         extension check: `.css`, `.woff2`; add woff2 content type)
      2. webview: `asWebviewUri` of `media/katex/katex.min.css`
      3. staged `.temp/assets` copy (extend staging to copy the katex dir
         recursively — path-safe)
- [ ] `RenderAssets` gains a `katexCss` field; the HTML template links it.
- [ ] TDD: failing tests first. New unit tests cover: inline math, block
      math, literal `$` text, invalid TeX no-crash, footnote ref +
      definition + backref, server serves `/assets/katex/katex.min.css` and
      a woff2 font (correct content type), server 404s non-whitelisted
      paths like `/assets/katex/../../secret`.
- [ ] Packaging check: vsix contains `media/katex/**` (v0.1.6 lesson —
      verify vsix contents before release).

## Out of Scope
- MathJax, mhchem, or other TeX extensions beyond stock KaTeX.
- Clickable/stateful task lists (already rendered read-only).
- Windows audit of pre-existing code (OMD-013).
- User settings/toggles for math (OMD-014 settings feature).
- Publishing a release (separate release step after verification).

## Success Criteria
1. All new unit tests pass; full suite (28 unit + 5 integration + new)
   passes; `npm run compile` succeeds.
2. Manual: open a .md with math + footnotes in browser preview and webview
   panel **with network disabled** — equations and footnotes render
   correctly in light and dark themes.
3. vsix size stays under ~2.5 MB; `media/katex/**` present in the package.
4. No new POSIX path assumptions (reviewed in diff).

## Open Questions
- None — delimiter style fixed to `$`/`$$` (dollars mode), matching GitHub
  and VS Code built-in preview conventions.
