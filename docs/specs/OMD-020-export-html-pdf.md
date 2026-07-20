# Spec: Export to self-contained HTML + Export to PDF (OMD-020)

**Status:** review
**Date:** 2026-07-20

## Goal
Let a user right-click any `.md` file and produce a shareable artifact that
opens with no VS Code and no internet:

- **Export to HTML** — one self-contained `.html` file (all assets inlined)
  written next to the source, meant to be sent to someone who just wants to
  view it.
- **Export to PDF** — open the document in the real browser and auto-trigger
  the print dialog, so the user picks "Save as PDF". No PDF engine bundled.

This is growth work (2026-07-20): a differentiator the built-in preview and
most competitors lack, and it fits OpenMD's "tiny + 100% offline" identity.
Follows the [OMD-016](../../harness/notes/OMD-016.md) growth push.

## Background
`generateHtml(markdown, title, assets, md, live?)` in `src/render.ts` already
produces a full HTML page, but it references assets by URL:
- `<link ... href="${assets.hljsCssLight}" media="all">` / `...Dark` `media="not all"`
- `<link rel="stylesheet" href="${assets.katexCss}">`
- `<script src="${assets.mermaidJs}"></script>` (head) and
  `<script src="${assets.hljsJs}"></script>` (end of body)

Rendering split (confirmed in code): **KaTeX math is pre-rendered to HTML
server-side** (only css + woff2 fonts needed at view time); **highlight.js
and Mermaid run client-side** on `window load` (`hljs.highlightAll()`,
`mermaid.run()`), so their JS/CSS must be present for the page to render.

A self-contained file therefore has to inline hljs (css+js) always, plus
Mermaid JS only when the document has diagrams and KaTeX css+fonts only when
it has math (Mermaid's bundle is ~2.8 MB — inlining it unconditionally would
bloat every export).

## Requirements

### A. Standalone HTML rendering (`src/render.ts`, unit-testable)
- [ ] Add an exported pure function that produces a **fully inlined** HTML
      string (proposed: `generateStandaloneHtml(markdown, title,
      inlineAssets, md)`), where `inlineAssets` carries raw file **contents**
      (not URLs). Refactor `htmlTemplate` minimally so it can emit either
      linked (existing behavior) or inlined asset tags — do not duplicate the
      whole template.
- [ ] Inlining rules for the produced file:
      - Theme CSS + the toggle/copy/emoji `<script>` — already inline, keep.
      - hljs CSS (light + dark) → inline `<style>` tags, **keeping the
        `media="all"` / `media="not all"` switching** so the in-page theme
        toggle still works (per OMD-018).
      - hljs JS → inline `<script>`.
      - Mermaid JS → inline **only if** the rendered body contains a
        `<pre class="mermaid">` block.
      - KaTeX css + woff2 fonts → inline **only if** the rendered body
        contains KaTeX output (`class="katex"`). Fonts embedded by rewriting
        the `url(...)` refs in `katex.min.css` to base64 `data:` URIs.
      - **No** live-reload script (no server backs a standalone file).
- [ ] The produced HTML contains **no** `http://`, `https://`, `localhost`,
      or `/assets/` references — everything is inline or a `data:` URI.
- [ ] Add an `@media print` stylesheet block to the shared template (benefits
      both the standalone file when printed and the Export-to-PDF flow):
      hide the theme-toggle / copy-button controls, sensible page margins,
      `pre, table, .mermaid { page-break-inside: avoid }`, force readable
      light colors on paper.

### B. Print trigger for the PDF flow (`src/render.ts`, shared template)
- [ ] In the page's `window load` handler, **after** Mermaid finishes
      (`mermaid.run()` promise resolved) and `hljs.highlightAll()` runs, if
      `new URLSearchParams(location.search).get('print')` is truthy, call
      `window.print()`. Harmless no-op when the param is absent (normal
      preview / `file://` standalone). No server change needed — the flag is
      read client-side.

### C. Commands + wiring (`src/extension.ts`)
- [ ] `openmd.exportHtml`: render the standalone HTML (reading the existing
      bundled asset files for inlining), write `<dir>/<basename>.html` next to
      the source (overwrite if present), then show an info message with
      **Reveal** (reveal in OS file manager) and **Open** actions.
- [ ] `openmd.exportPdf`: reuse the existing browser-preview path (start the
      preview server if needed) and open the served document URL with
      `?print=1` appended.
- [ ] Register both in `contributes.commands` and add them to the
      `explorer/context`, `editor/context`, and `commandPalette` menus with
      `when: resourceExtname == .md`, grouped after the two existing commands.
      Titles: "Export to HTML", "Export to PDF".
- [ ] All new path handling uses the `src/paths.ts` helpers (cross-platform,
      per OMD-013) — no raw POSIX separators.

## Out of Scope
- True headless one-click PDF (would require bundling Chromium/Puppeteer —
  rejected: breaks the tiny+offline identity).
- Save-As dialog / configurable output directory (decided: auto next to
  source).
- Batch/multi-file export.
- A theme picker for export: the standalone file defaults to **light**
  (universal, print-friendly) but keeps the in-page light/dark toggle.

## Success Criteria
- `npm run compile` succeeds; full `npm run test:unit` stays green.
- New unit tests (pure, alongside the existing render tests) assert:
  standalone output has no external/`/assets/` URLs; Mermaid JS present iff
  the doc has a mermaid block; KaTeX css present iff the doc has math; no
  live-reload script; `@media print` block present; the shared template's
  script contains the `print` query-param check.
- Host/browser verification (Playwright, as in OMD-012): a doc with Mermaid +
  math exported to HTML opens **offline** in a browser and renders fully;
  Export to PDF opens the browser and the print dialog appears with diagrams
  already rendered.

## Open Questions
- None — design approved by the owner (2026-07-20). Execution to be delegated
  to Codex CLI per the established workflow (Claude specs/reviews/commits).
