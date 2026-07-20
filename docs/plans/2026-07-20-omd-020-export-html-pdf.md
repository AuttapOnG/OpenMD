# Export to HTML + PDF (OMD-020) Implementation Plan

> **For agentic workers:** Implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Each task: write the failing test → run it (see it fail) → minimal implementation → run it (see it pass) → commit.

**Goal:** Add two right-click commands on `.md` files — **Export to HTML** (one self-contained file with all assets inlined) and **Export to PDF** (open in the browser and auto-trigger the print dialog).

**Architecture:** Reuse the existing `src/render.ts` pipeline. Refactor `htmlTemplate` so it can emit either *linked* asset tags (current behavior, keeps `generateHtml` identical) or *inlined* asset tags (new `generateStandaloneHtml`). Mermaid JS (2.6 MB) is inlined only when the document has a diagram; KaTeX css/fonts only when it has math. The shared template gains an `@media print` block and a client-side `?print=1` → `window.print()` trigger (no server change). Two new commands in `src/extension.ts` wire it up.

**Tech Stack:** TypeScript, VS Code Extension API, markdown-it, mocha + `assert` unit tests.

## Global Constraints

- **No new runtime dependencies.** PDF is produced via the browser's own print dialog — do NOT add Puppeteer/Chromium or any package.
- **Assets live in `media/`**: `highlight.min.js` (158 K), `github.min.css`, `github-dark.min.css`, `mermaid.min.js` (2.6 MB), `katex/katex.min.css`, `katex/fonts/*.woff2` (only `.woff2` vendored — the css also names `.woff`/`.ttf` that do NOT exist).
- **Windows-safe paths** (per OMD-013): use `path.join` and native `fsPath`; never hand-build POSIX separators.
- **Pure render functions stay pure** — no `fs`/`vscode` imports in `src/render.ts`. File reading happens in `src/extension.ts` and is injected.
- **Test runner:** `npm run test:unit` = `npm run compile && mocha out/test/unit/**/*.test.js`. Run one file with `npm run compile && npx mocha out/test/unit/<name>.test.js`.
- **Commit discipline:** commit after each task. (On the sandbox host, if `.git` writes are blocked, the reviewing operator commits per task boundary — keep the commit step in each task regardless.)

---

### Task 1: `generateStandaloneHtml` with conditional asset inlining

**Files:**
- Modify: `src/render.ts` (refactor `htmlTemplate`; add `InlineAssets`, `generateStandaloneHtml`)
- Test: `src/test/unit/render-standalone.test.ts` (create)

**Interfaces:**
- Consumes: `createMarkdownParser()`, existing `RenderAssets`, `MarkdownIt`.
- Produces:
  - `export interface InlineAssets { hljsJs: string; hljsCssLight: string; hljsCssDark: string; mermaidJs: string; katexCss: string; }` — every field is the raw **contents** of the asset (the `katexCss` field is expected to already have its fonts embedded; see Task 3).
  - `export function generateStandaloneHtml(markdown: string, title: string, inline: InlineAssets, md: MarkdownIt): string`

- [ ] **Step 1: Write the failing test**

Create `src/test/unit/render-standalone.test.ts`:

```ts
import * as assert from 'assert';
import { createMarkdownParser, generateStandaloneHtml, InlineAssets } from '../../render';

const INLINE: InlineAssets = {
  hljsJs: 'HLJS_JS_MARKER',
  hljsCssLight: 'HLJS_LIGHT_MARKER',
  hljsCssDark: 'HLJS_DARK_MARKER',
  mermaidJs: 'MERMAID_JS_MARKER',
  katexCss: 'KATEX_CSS_MARKER',
};

describe('generateStandaloneHtml', () => {
  const md = createMarkdownParser();
  const render = (markdown: string) => generateStandaloneHtml(markdown, 't', INLINE, md);

  it('inlines hljs css and js', () => {
    const html = render('# Hi\n\n```js\nx\n```');
    assert.ok(html.includes('HLJS_LIGHT_MARKER'), 'hljs light css not inlined');
    assert.ok(html.includes('HLJS_DARK_MARKER'), 'hljs dark css not inlined');
    assert.ok(html.includes('HLJS_JS_MARKER'), 'hljs js not inlined');
  });

  it('keeps the id + media attributes so the theme toggle still works', () => {
    const html = render('# Hi');
    assert.ok(/<style id="hljs-css-light" media="all">/.test(html), 'light style tag id/media missing');
    assert.ok(/<style id="hljs-css-dark" media="not all">/.test(html), 'dark style tag id/media missing');
  });

  it('has no external or served asset URLs in our own markup', () => {
    const html = render('# Hi\n\n```js\nx\n```');
    assert.ok(!html.includes('/assets/'), 'served /assets/ path leaked');
    assert.ok(!/(href|src)="https?:/.test(html), 'http(s) asset ref leaked');
    assert.ok(!/(href|src)="file:/.test(html), 'file: asset ref leaked');
  });

  it('inlines mermaid js ONLY when a mermaid block is present', () => {
    const withDiagram = render('```mermaid\nflowchart TD\nA-->B\n```');
    const without = render('# just text');
    assert.ok(withDiagram.includes('MERMAID_JS_MARKER'), 'mermaid js missing when diagram present');
    assert.ok(!without.includes('MERMAID_JS_MARKER'), 'mermaid js inlined without any diagram');
  });

  it('inlines katex css ONLY when math is present', () => {
    const withMath = render('inline $a^2+b^2$ end');
    const without = render('# no math here');
    assert.ok(withMath.includes('KATEX_CSS_MARKER'), 'katex css missing when math present');
    assert.ok(!without.includes('KATEX_CSS_MARKER'), 'katex css inlined without any math');
  });

  it('omits the live-reload script', () => {
    assert.ok(!render('# Hi').includes('openmd-scroll'), 'live-reload script must not be present');
  });
});
```

- [ ] **Step 2: Run the test, verify it fails**

Run: `npm run compile`
Expected: FAIL to compile — `generateStandaloneHtml` / `InlineAssets` are not exported from `render.ts`.

- [ ] **Step 3: Refactor `htmlTemplate` to take pre-built asset tags**

In `src/render.ts`, add this interface + two helpers just above the current `htmlTemplate` (around line 150):

```ts
interface AssetTags {
  /** Goes in <head>: hljs css, katex css, mermaid script. */
  headAssets: string;
  /** Goes near </body>: the highlight.js script. */
  hljsScript: string;
}

function linkedTags(assets: RenderAssets): AssetTags {
  return {
    headAssets: `<link rel="stylesheet" id="hljs-css-light" href="${assets.hljsCssLight}" media="all">
    <link rel="stylesheet" id="hljs-css-dark" href="${assets.hljsCssDark}" media="not all">
    <link rel="stylesheet" href="${assets.katexCss}">
    <script src="${assets.mermaidJs}"></script>`,
    hljsScript: `<script src="${assets.hljsJs}"></script>`,
  };
}

function inlineTags(inline: InlineAssets, opts: { mermaid: boolean; math: boolean }): AssetTags {
  return {
    headAssets: `<style id="hljs-css-light" media="all">${inline.hljsCssLight}</style>
    <style id="hljs-css-dark" media="not all">${inline.hljsCssDark}</style>
    ${opts.math ? `<style>${inline.katexCss}</style>` : ''}
    ${opts.mermaid ? `<script>${inline.mermaidJs}</script>` : ''}`,
    hljsScript: `<script>${inline.hljsJs}</script>`,
  };
}
```

Change the `htmlTemplate` signature from `(body, title, assets: RenderAssets, live?)` to take `AssetTags`:

```ts
function htmlTemplate(body: string, title: string, tags: AssetTags, live?: LiveReloadOptions): string {
```

Inside `htmlTemplate`, replace the four asset lines (current lines 160–167) with:

```html
    <!-- Syntax highlighting + KaTeX + Mermaid (linked in preview, inlined in standalone export) -->
    ${tags.headAssets}
```

and replace `<script src="${assets.hljsJs}"></script>` (current line 527) with:

```html
    ${tags.hljsScript}
```

- [ ] **Step 4: Point `generateHtml` at `linkedTags` and add `generateStandaloneHtml`**

Update `generateHtml` (keep its exported signature unchanged) so its body reads:

```ts
export function generateHtml(
  markdown: string,
  title: string,
  assets: RenderAssets,
  md: MarkdownIt,
  live?: LiveReloadOptions
): string {
  const body = md.render(markdown);
  return htmlTemplate(body, title, linkedTags(assets), live);
}
```

Add the new interface + function next to it:

```ts
export interface InlineAssets {
  hljsJs: string;
  hljsCssLight: string;
  hljsCssDark: string;
  mermaidJs: string;
  katexCss: string;
}

export function generateStandaloneHtml(
  markdown: string,
  title: string,
  inline: InlineAssets,
  md: MarkdownIt
): string {
  const body = md.render(markdown);
  const hasMermaid = body.includes('class="mermaid"');
  const hasMath = /class="katex/.test(body);
  return htmlTemplate(body, title, inlineTags(inline, { mermaid: hasMermaid, math: hasMath }), undefined);
}
```

- [ ] **Step 5: Run the tests, verify they pass**

Run: `npm run compile && npx mocha out/test/unit/render-standalone.test.js`
Expected: PASS (6 passing).
Run: `npm run test:unit`
Expected: the whole suite stays green (the `htmlTemplate` refactor must not change `generateHtml` output — existing render tests still pass).

- [ ] **Step 6: Commit**

```bash
git add src/render.ts src/test/unit/render-standalone.test.ts
git commit -m "feat: generateStandaloneHtml with conditional asset inlining (OMD-020)"
```

---

### Task 2: `@media print` styles + mermaid guard + `?print=1` trigger

**Files:**
- Modify: `src/render.ts` (the shared `<style>` block and the body `<script>` in `htmlTemplate`)
- Test: `src/test/unit/render-print.test.ts` (create)

**Interfaces:**
- Consumes: `generateHtml`, `RenderAssets` (from Task 1's shape — unchanged public signature).
- Produces: no new exports; changes are inside the shared template so both preview and standalone benefit.

- [ ] **Step 1: Write the failing test**

Create `src/test/unit/render-print.test.ts`:

```ts
import * as assert from 'assert';
import { createMarkdownParser, generateHtml, RenderAssets } from '../../render';

const ASSETS: RenderAssets = {
  mermaidJs: 'm', hljsJs: 'h', hljsCssLight: 'l', hljsCssDark: 'd', katexCss: 'k',
};

describe('print / PDF support in the shared template', () => {
  const md = createMarkdownParser();
  const html = generateHtml('# Hi', 't', ASSETS, md);

  it('includes an @media print stylesheet', () => {
    assert.ok(html.includes('@media print'), '@media print block missing');
  });

  it('auto-triggers window.print() when the print query param is set', () => {
    assert.ok(html.includes("get('print')"), 'print query-param check missing');
    assert.ok(html.includes('window.print()'), 'window.print() call missing');
  });

  it('guards mermaid usage so a diagram-less standalone file does not crash', () => {
    assert.ok(html.includes("typeof mermaid !== 'undefined'"), 'mermaid guard missing');
  });
});
```

- [ ] **Step 2: Run the test, verify it fails**

Run: `npm run compile && npx mocha out/test/unit/render-print.test.js`
Expected: FAIL — none of `@media print`, `get('print')`, or the mermaid guard exist yet.

- [ ] **Step 3: Add the `@media print` block**

In `src/render.ts`, inside the main `<style>` block, immediately before its closing `</style>` (current line ~515, right after the `@media (prefers-color-scheme: dark)` rule), add:

```css
        /* Print / PDF export (Export to PDF opens the browser and prints) */
        @media print {
            .theme-toggle, .copy-code-btn { display: none !important; }
            body { max-width: none; padding: 0; color: #000; background: #fff; }
            pre, table, .mermaid, .katex-display { page-break-inside: avoid; }
            a { color: #000; text-decoration: underline; }
        }
```

- [ ] **Step 4: Guard mermaid and add the print trigger**

In the body `<script>` of `htmlTemplate` (current lines ~529–557), replace the un-guarded `mermaid.initialize({...})` call and the `load` handler with:

```js
        // Initialize Mermaid (guarded — a standalone export without diagrams omits mermaid.js)
        if (typeof mermaid !== 'undefined') {
            mermaid.initialize({
                startOnLoad: false,
                theme: 'default',
                securityLevel: 'loose'
            });
        }

        // Wait for window load, then render, then (for Export to PDF) print
        window.addEventListener('load', async function() {
            if (typeof mermaid !== 'undefined') {
                try { await mermaid.run(); } catch (e) { console.error('Mermaid error:', e); }
            }

            if (typeof hljs !== 'undefined') {
                hljs.highlightAll();
            }

            convertEmojis();

            // Export to PDF: open the print dialog once everything has rendered
            if (new URLSearchParams(location.search).get('print')) {
                window.print();
            }
        });
```

(Leave `convertEmojis`, the copy-button block, and the theme-toggle IIFE below it unchanged.)

- [ ] **Step 5: Run the tests, verify they pass**

Run: `npm run compile && npx mocha out/test/unit/render-print.test.js`
Expected: PASS (3 passing).
Run: `npm run test:unit`
Expected: whole suite green.

- [ ] **Step 6: Commit**

```bash
git add src/render.ts src/test/unit/render-print.test.ts
git commit -m "feat: @media print styles + mermaid guard + ?print=1 trigger (OMD-020)"
```

---

### Task 3: `embedKatexFonts` — inline woff2 fonts as data URIs

**Files:**
- Modify: `src/render.ts` (add `embedKatexFonts`)
- Test: `src/test/unit/render-katex-embed.test.ts` (create)

**Interfaces:**
- Produces: `export function embedKatexFonts(cssText: string, readFont: (file: string) => Buffer | null): string` — replaces every `url(fonts/NAME.woff2)` with a base64 `data:` URI (via the injected `readFont`) and strips the `.woff`/`.ttf` fallbacks that are not vendored. Injecting `readFont` keeps the function pure/testable (the `fs` read lives in Task 4).

- [ ] **Step 1: Write the failing test**

Create `src/test/unit/render-katex-embed.test.ts`:

```ts
import * as assert from 'assert';
import { embedKatexFonts } from '../../render';

describe('embedKatexFonts', () => {
  const css =
    '@font-face{font-family:KaTeX_AMS;src:url(fonts/KaTeX_AMS-Regular.woff2) format("woff2"),' +
    'url(fonts/KaTeX_AMS-Regular.woff) format("woff"),' +
    'url(fonts/KaTeX_AMS-Regular.ttf) format("truetype")}';

  it('embeds woff2 as a base64 data URI and drops woff/ttf refs', () => {
    const out = embedKatexFonts(css, (file) => (file.endsWith('.woff2') ? Buffer.from('FONTBYTES') : null));
    assert.ok(out.includes('data:font/woff2;base64,'), 'woff2 not embedded as data URI');
    assert.ok(out.includes(Buffer.from('FONTBYTES').toString('base64')), 'font bytes not base64-encoded');
    assert.ok(!out.includes('fonts/'), 'a relative fonts/ ref survived');
    assert.ok(!out.includes('.ttf'), 'ttf ref survived');
  });

  it('leaves a woff2 ref alone if the font is missing (no crash)', () => {
    const out = embedKatexFonts('src:url(fonts/Missing.woff2) format("woff2")', () => null);
    assert.ok(out.includes('fonts/Missing.woff2'), 'missing font should be left untouched');
  });
});
```

- [ ] **Step 2: Run the test, verify it fails**

Run: `npm run compile && npx mocha out/test/unit/render-katex-embed.test.js`
Expected: FAIL — `embedKatexFonts` is not exported.

- [ ] **Step 3: Implement `embedKatexFonts`**

Add to `src/render.ts` (near the other exported functions):

```ts
/**
 * Make katex.min.css self-contained: embed each vendored woff2 as a base64
 * data URI and drop the .woff/.ttf fallbacks (only .woff2 is vendored, so
 * those refs would otherwise be broken relative links).
 */
export function embedKatexFonts(cssText: string, readFont: (file: string) => Buffer | null): string {
  // 1. Drop the non-woff2 fallback refs (each is preceded by a comma).
  let css = cssText.replace(
    /,\s*url\(fonts\/[^)]*\.(?:woff|ttf)\)\s*format\((?:'|")[^)]*(?:'|")\)/g,
    ''
  );
  // 2. Inline the remaining woff2 refs as data URIs.
  css = css.replace(/url\(fonts\/([^)]+\.woff2)\)/g, (match, file: string) => {
    const buf = readFont(file);
    if (!buf) { return match; }
    return `url(data:font/woff2;base64,${buf.toString('base64')})`;
  });
  return css;
}
```

- [ ] **Step 4: Run the tests, verify they pass**

Run: `npm run compile && npx mocha out/test/unit/render-katex-embed.test.js`
Expected: PASS (2 passing).

- [ ] **Step 5: Commit**

```bash
git add src/render.ts src/test/unit/render-katex-embed.test.ts
git commit -m "feat: embedKatexFonts inlines woff2 as data URIs (OMD-020)"
```

---

### Task 4: `openmd.exportHtml` + `openmd.exportPdf` commands

**Files:**
- Modify: `src/extension.ts`

**Interfaces:**
- Consumes: `generateStandaloneHtml`, `InlineAssets`, `embedKatexFonts` (Tasks 1 & 3); `generateHtml`; the existing `ensureServer`, `mirrorHtmlPathFor`, `toUrlPath`, `md`, `context`, `browserAssets`.
- Produces: two registered commands (referenced by `package.json` in Task 5).

- [ ] **Step 1: Update the render import**

At the top of `src/extension.ts`, extend the render import:

```ts
import { createMarkdownParser, generateHtml, generateStandaloneHtml, embedKatexFonts, RenderAssets, InlineAssets } from './render';
```

- [ ] **Step 2: Add a helper that builds the inlined assets**

Inside `activate`, after `const md = createMarkdownParser();`, add:

```ts
  const mediaPath = (...p: string[]) => path.join(context.extensionPath, 'media', ...p);
  function buildInlineAssets(): InlineAssets {
    const katexCss = embedKatexFonts(
      fs.readFileSync(mediaPath('katex', 'katex.min.css'), 'utf-8'),
      (file) => {
        try { return fs.readFileSync(mediaPath('katex', 'fonts', file)); }
        catch { return null; }
      }
    );
    return {
      hljsJs: fs.readFileSync(mediaPath('highlight.min.js'), 'utf-8'),
      hljsCssLight: fs.readFileSync(mediaPath('github.min.css'), 'utf-8'),
      hljsCssDark: fs.readFileSync(mediaPath('github-dark.min.css'), 'utf-8'),
      mermaidJs: fs.readFileSync(mediaPath('mermaid.min.js'), 'utf-8'),
      katexCss,
    };
  }
```

- [ ] **Step 3: Register `openmd.exportHtml`**

Add before the final `context.subscriptions.push(...)`:

```ts
  // Command: Export to HTML (self-contained single file, next to the source)
  let exportHtml = vscode.commands.registerCommand(
    'openmd.exportHtml',
    async (uri: vscode.Uri) => {
      const fileUri = uri || vscode.window.activeTextEditor?.document.uri;
      if (!fileUri) {
        vscode.window.showErrorMessage('No markdown file selected');
        return;
      }
      try {
        const content = fs.readFileSync(fileUri.fsPath, 'utf-8');
        const html = generateStandaloneHtml(
          content,
          path.basename(fileUri.fsPath, '.md'),
          buildInlineAssets(),
          md
        );
        const outPath = fileUri.fsPath.replace(/\.md$/i, '.html');
        fs.writeFileSync(outPath, html);

        const OPEN = 'Open', REVEAL = 'Reveal';
        const choice = await vscode.window.showInformationMessage(
          `OpenMD: exported ${path.basename(outPath)}`, OPEN, REVEAL
        );
        if (choice === OPEN) {
          await vscode.env.openExternal(vscode.Uri.file(outPath));
        } else if (choice === REVEAL) {
          await vscode.commands.executeCommand('revealFileInOS', vscode.Uri.file(outPath));
        }
      } catch (error) {
        vscode.window.showErrorMessage(`OpenMD export failed: ${error}`);
      }
    }
  );
```

- [ ] **Step 4: Register `openmd.exportPdf`**

Immediately after `exportHtml`:

```ts
  // Command: Export to PDF (open in the browser + auto-print → Save as PDF)
  let exportPdf = vscode.commands.registerCommand(
    'openmd.exportPdf',
    async (uri: vscode.Uri) => {
      const fileUri = uri || vscode.window.activeTextEditor?.document.uri;
      if (!fileUri) {
        vscode.window.showErrorMessage('No markdown file selected');
        return;
      }
      try {
        const server = await ensureServer();
        if (server) {
          const urlPath = '/' + toUrlPath(mirrorHtmlPathFor(fileUri));
          server.register(urlPath, fileUri.fsPath);
          await vscode.env.openExternal(vscode.Uri.parse(server.url(urlPath) + '?print=1'));
          vscode.window.showInformationMessage('OpenMD: opening print dialog — choose "Save as PDF".');
          return;
        }
        // Fallback: no server — export a standalone file and open it (print manually).
        const content = fs.readFileSync(fileUri.fsPath, 'utf-8');
        const html = generateStandaloneHtml(content, path.basename(fileUri.fsPath, '.md'), buildInlineAssets(), md);
        const outPath = fileUri.fsPath.replace(/\.md$/i, '.html');
        fs.writeFileSync(outPath, html);
        await vscode.env.openExternal(vscode.Uri.file(outPath));
        vscode.window.showWarningMessage('OpenMD: live server unavailable — opened the HTML; press Ctrl/Cmd+P to Save as PDF.');
      } catch (error) {
        vscode.window.showErrorMessage(`OpenMD PDF export failed: ${error}`);
      }
    }
  );
```

- [ ] **Step 5: Add the commands to subscriptions**

Change the final push line to include the two new commands:

```ts
  context.subscriptions.push(openInBrowser, openInPreview, exportHtml, exportPdf);
```

- [ ] **Step 6: Compile and run the full suite**

Run: `npm run compile && npm run test:unit`
Expected: compiles clean; whole suite green (no new unit tests here — command wiring is verified on the host in Task 5).

- [ ] **Step 7: Commit**

```bash
git add src/extension.ts
git commit -m "feat: exportHtml + exportPdf commands (OMD-020)"
```

---

### Task 5: Register commands + menus in `package.json`, then host verification

**Files:**
- Modify: `package.json` (`contributes.commands` + `contributes.menus`)

- [ ] **Step 1: Add the two commands**

In `contributes.commands`, after the two existing entries, add:

```json
      {
        "command": "openmd.exportHtml",
        "title": "Export to HTML",
        "icon": "$(file-code)"
      },
      {
        "command": "openmd.exportPdf",
        "title": "Export to PDF",
        "icon": "$(file-pdf)"
      }
```

- [ ] **Step 2: Add them to all three menus**

In `contributes.menus`, add to `explorer/context` and `editor/context` (after the existing two, same `when`):

```json
        {
          "command": "openmd.exportHtml",
          "when": "resourceExtname == .md",
          "group": "2_open@12"
        },
        {
          "command": "openmd.exportPdf",
          "when": "resourceExtname == .md",
          "group": "2_open@13"
        }
```

and to `commandPalette`:

```json
        {
          "command": "openmd.exportHtml",
          "when": "resourceExtname == .md"
        },
        {
          "command": "openmd.exportPdf",
          "when": "resourceExtname == .md"
        }
```

- [ ] **Step 3: Validate manifest + compile + full suite**

Run: `node -e "require('./package.json'); console.log('json ok')"`
Run: `npm run compile && npm run test:unit`
Run: `npx vsce ls > /dev/null && echo "vsce ok"`
Expected: `json ok`, whole suite green, `vsce ok`.

- [ ] **Step 4: Commit**

```bash
git add package.json
git commit -m "feat: contribute Export to HTML/PDF commands + menus (OMD-020)"
```

- [ ] **Step 5: Host / browser verification (operator, not sandbox)**

Manual (or Playwright, as in OMD-012). Create a test `.md` with a mermaid block, `$x^2$` math, a code fence, and an alert, then:
1. **Export to HTML** → a `.html` appears next to it. Open it in a browser with networking **disabled**: headings, highlighted code, the Mermaid diagram, and the math all render; the light/dark toggle and copy buttons work. Confirm the file has no failed network requests (DevTools → Network).
2. A **plain** doc (no diagram/math) → the exported file is far smaller (no 2.6 MB mermaid bundle, no katex css).
3. **Export to PDF** → the browser opens and the print dialog appears automatically, with the diagram already rendered; "Save as PDF" produces a clean PDF (toggle/copy buttons hidden via `@media print`).

- [ ] **Step 6: Close-out bookkeeping (operator)**

Write `harness/notes/OMD-020.md`, flip OMD-020 to `done` in `harness/feature_list.json`, update `harness/progress.md` (Current State + index), and log to `WORKING_STATE.md`. (Release/CHANGELOG is a separate step, not part of this plan.)

---

## Self-Review

**Spec coverage:**
- Standalone HTML, no external URLs, conditional mermaid/katex, no live-reload → Task 1. ✅
- `@media print` + `?print=1` trigger + mermaid guard → Task 2. ✅
- KaTeX fonts inlined as data URIs → Task 3. ✅
- `exportHtml` (next to source, Reveal/Open) + `exportPdf` (browser + `?print=1`) + paths.ts-safe → Task 4. ✅
- Commands + context/editor/palette menus → Task 5. ✅
- Compile + full suite + host/browser check → Tasks 4/5. ✅

**Placeholder scan:** none — every code/test/command step is concrete.

**Type consistency:** `InlineAssets` fields (`hljsJs`, `hljsCssLight`, `hljsCssDark`, `mermaidJs`, `katexCss`) are identical across Task 1 (definition), Task 4 (`buildInlineAssets`), and the tests. `generateStandaloneHtml(markdown, title, inline, md)` and `embedKatexFonts(cssText, readFont)` signatures match every call site.

**Note on the "no http" test:** it asserts our *markup* has no external asset refs (using marker contents). Real `mermaid.min.js` contains harmless SVG-namespace strings like `http://www.w3.org/2000/svg`; those are not network fetches. True offline behavior is confirmed in Task 5 host verification.
