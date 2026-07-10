# OMD-012: KaTeX Math + Footnotes Implementation Plan

> **For agentic workers:** Execute tasks strictly in order, step by step.
> Steps use checkbox (`- [ ]`) syntax — check off completed steps in this
> file as you go.

**Goal:** Render TeX math (`$…$` inline, `$$…$$` block) and Markdown
footnotes in all preview surfaces, fully offline, rendered server-side in
Node.

**Architecture:** markdown-it plugins (`markdown-it-texmath` with the
`katex` engine, `markdown-it-footnote`) render at conversion time inside
the extension host; the browser/webview only loads `katex.min.css` + woff2
fonts vendored into `media/katex/` by the esbuild build script.

**Tech Stack:** TypeScript, markdown-it 14, katex 0.17, esbuild, mocha.

## Global Constraints (Codex sandbox — read first)

- **No network.** All npm deps (`katex`, `markdown-it-texmath`,
  `markdown-it-footnote`) are ALREADY installed in `node_modules/`. Do NOT
  run npm install or any network command.
- **Git may be unwritable.** Attempt each commit step; if `git commit`
  fails with a permission error, append one line
  `- [codex] commit failed for: <message>` to `WORKING_STATE.md` and
  continue to the next step. Never retry with sudo.
- **Cannot bind ports.** Do NOT run `out/test/unit/server.test.js` (it
  starts an HTTP listener and will fail with EPERM in this sandbox). You
  still WRITE the new server tests; the host runs them later. Run only:
  `npx mocha "out/test/unit/render*.test.js"`.
- **Do not** mark the feature done in `harness/feature_list.json`, do not
  touch `.claude/`, do not run any publish/push command.
- **Windows-safety rule for all new code:** filesystem paths via
  `path.join` (never string-concat with `/`); URL paths served over HTTP
  always use `/` literals. This code must run unmodified on Windows.
- Leave every checkbox marked `(HOST)` unchecked — the host verifies those.

---

### Task 1: Vendor KaTeX assets in the build (esbuild.js)

**Files:**
- Modify: `esbuild.js` (copy step, after the existing `copies` loop)

**Interfaces:**
- Produces: `media/katex/katex.min.css` and `media/katex/fonts/*.woff2`
  (20 files) on every `npm run build`. Later tasks rely on exactly these
  paths.

- [ ] **Step 1: Add the katex copy block**

In `esbuild.js`, immediately AFTER the existing `for (const [src, dest] of copies)` loop, insert:

```js
  // 3b. KaTeX: css + woff2 fonts only, preserving katex/fonts/ layout so
  // the css's relative url(fonts/...) references resolve everywhere.
  const katexSrc = path.join('node_modules', 'katex', 'dist');
  const katexFontsDest = path.join('media', 'katex', 'fonts');
  fs.mkdirSync(katexFontsDest, { recursive: true });
  fs.copyFileSync(
    path.join(katexSrc, 'katex.min.css'),
    path.join('media', 'katex', 'katex.min.css')
  );
  for (const f of fs.readdirSync(path.join(katexSrc, 'fonts'))) {
    if (f.endsWith('.woff2')) {
      fs.copyFileSync(path.join(katexSrc, 'fonts', f), path.join(katexFontsDest, f));
    }
  }
```

Also add `'media/katex/katex.min.css'` to the size-report array at the end
of `main()` (the `for (const f of [...])` list).

- [ ] **Step 2: Run the build and verify the files land**

Run: `npm run build && node -e "const fs=require('fs');const path=require('path');const n=fs.readdirSync(path.join('media','katex','fonts')).filter(f=>f.endsWith('.woff2')).length;if(!fs.existsSync(path.join('media','katex','katex.min.css'))||n!==20){console.error('katex assets missing, fonts='+n);process.exit(1)};console.log('katex assets ok, fonts='+n)"`
Expected: `katex assets ok, fonts=20`

- [ ] **Step 3: Commit**

```bash
git add esbuild.js
git commit -m "build: vendor katex css + woff2 fonts into media/katex (OMD-012)"
```

---

### Task 2: Math + footnotes in the render pipeline (render.ts)

**Files:**
- Modify: `src/types.d.ts` (two new module declarations)
- Modify: `src/render.ts` (imports, `RenderAssets`, plugin registration,
  template `<link>`, CSS)
- Create: `src/test/unit/render-math.test.ts`
- Modify: `src/test/unit/render.test.ts` and
  `src/test/unit/render-features.test.ts` (add `katexCss` to every
  `RenderAssets` object literal — the compiler will flag each site)

**Interfaces:**
- Produces: `RenderAssets` gains required field `katexCss: string`. The
  generated HTML links it via
  `<link rel="stylesheet" href="${assets.katexCss}">`. Task 4 constructs
  three `RenderAssets` objects and must supply `katexCss`.

- [ ] **Step 1: Write the failing tests**

Create `src/test/unit/render-math.test.ts`:

```ts
import * as assert from 'assert';
import { createMarkdownParser, generateHtml, RenderAssets } from '../../render';

const ASSETS: RenderAssets = {
  mermaidJs: 'file:///assets/mermaid.min.js',
  hljsJs: 'file:///assets/highlight.min.js',
  hljsCssLight: 'file:///assets/github.min.css',
  hljsCssDark: 'file:///assets/github-dark.min.css',
  katexCss: 'file:///assets/katex/katex.min.css',
};

describe('math rendering (KaTeX, server-side)', () => {
  const md = createMarkdownParser();

  it('renders $...$ as inline KaTeX HTML', () => {
    const out = md.render('Euler: $e^{i\\pi} = -1$');
    assert.ok(out.includes('class="katex"'), 'inline math must be pre-rendered');
  });

  it('renders $$...$$ as display math', () => {
    const out = md.render('$$\\int_0^1 x\\,dx$$');
    assert.ok(out.includes('katex-display'), 'block math must use display mode');
  });

  it('leaves plain-text dollar amounts alone', () => {
    const out = md.render('ราคา $5 กับ $10 ครับ');
    assert.ok(!out.includes('katex'), 'currency text must stay literal');
  });

  it('leaves escaped \\$ literal', () => {
    const out = md.render('a \\$5$ b');
    assert.ok(!out.includes('katex'), 'escaped dollar must stay literal');
  });

  it('does not throw on invalid TeX', () => {
    const out = md.render('$\\frobnicate{$');
    assert.ok(out.length > 0, 'render must survive invalid TeX');
  });

  it('links the katex stylesheet in generated HTML', () => {
    const html = generateHtml('# hi', 'hi', ASSETS, md);
    assert.ok(html.includes(ASSETS.katexCss), 'katex css must be linked');
  });
});

describe('footnotes', () => {
  const md = createMarkdownParser();

  it('renders footnote references and definitions with backrefs', () => {
    const out = md.render('Fact.[^1]\n\n[^1]: Source here.');
    assert.ok(out.includes('footnote-ref'), 'must render the [^1] reference');
    assert.ok(out.includes('class="footnotes"'), 'must render the footnotes section');
    assert.ok(out.includes('footnote-backref'), 'must render the back-link');
  });
});
```

- [ ] **Step 2: Compile — expect failures**

Run: `npm run compile`
Expected: FAIL — `katexCss` does not exist on `RenderAssets`, and
`markdown-it-texmath` / `markdown-it-footnote` are not yet imported.

- [ ] **Step 3: Add type declarations**

Append to `src/types.d.ts`:

```ts
declare module 'markdown-it-texmath' {
  import MarkdownIt from 'markdown-it';
  const texmath: (
    md: MarkdownIt,
    options?: { engine?: unknown; delimiters?: string; katexOptions?: Record<string, unknown> }
  ) => void;
  export default texmath;
}

declare module 'markdown-it-footnote' {
  import MarkdownIt from 'markdown-it';
  const footnote: (md: MarkdownIt) => void;
  export default footnote;
}
```

- [ ] **Step 4: Implement in render.ts**

4a. Add imports (after the existing plugin imports at the top):

```ts
import katex from 'katex';
import markdownItTexmath from 'markdown-it-texmath';
import markdownItFootnote from 'markdown-it-footnote';
```

4b. Add `katexCss` to the interface:

```ts
export interface RenderAssets {
  mermaidJs: string;
  hljsJs: string;
  hljsCssLight: string;
  hljsCssDark: string;
  katexCss: string;
}
```

4c. In `createMarkdownParser()`, after the `markdownItEmoji` try-block,
register the two plugins with the same try/console pattern used by the
existing plugins:

```ts
    try {
      md.use(markdownItTexmath, {
        engine: katex,
        delimiters: 'dollars',
        katexOptions: { throwOnError: false },
      });
      console.log('✓ markdown-it-texmath (katex) loaded');
    } catch (e) { console.error('✗ markdown-it-texmath failed:', e); }

    try {
      md.use(markdownItFootnote);
      console.log('✓ markdown-it-footnote loaded');
    } catch (e) { console.error('✗ markdown-it-footnote failed:', e); }
```

4d. In `htmlTemplate()`, add the stylesheet link right after the two hljs
`<link>` lines:

```html
    <!-- KaTeX (math pre-rendered server-side; css + fonts only) -->
    <link rel="stylesheet" href="${assets.katexCss}">
```

4e. In the template's `<style>` block, after the `/* Task Lists */` rules,
add:

```css
        /* Math (KaTeX) */
        .katex-display {
            overflow-x: auto;
            padding: 4px 0;
        }

        /* Footnotes */
        section.footnotes {
            font-size: 90%;
            opacity: 0.85;
        }

        .footnote-backref {
            text-decoration: none;
        }
```

- [ ] **Step 5: Fix existing test fixtures**

`npm run compile` will now flag every `RenderAssets` object literal missing
`katexCss` (in `src/test/unit/render.test.ts`,
`src/test/unit/render-features.test.ts`, and possibly others). Add this
line to each flagged literal:

```ts
  katexCss: 'file:///assets/katex/katex.min.css',
```

- [ ] **Step 6: Run the render tests**

Run: `npm run compile && npx mocha "out/test/unit/render*.test.js"`
Expected: PASS — all pre-existing render tests plus the new math/footnote
tests. (Do not run server tests — sandbox cannot bind ports.)

- [ ] **Step 7: Commit**

```bash
git add src/types.d.ts src/render.ts src/test/unit/render-math.test.ts src/test/unit/render.test.ts src/test/unit/render-features.test.ts
git commit -m "feat: server-side KaTeX math + footnotes in render pipeline (OMD-012)"
```

---

### Task 3: Serve the katex asset subtree (server.ts)

**Files:**
- Modify: `src/server.ts`
- Modify: `src/test/unit/server.test.ts` (new cases; WRITE + COMPILE only
  — do not execute in the sandbox)

**Interfaces:**
- Consumes: nothing new from earlier tasks (assets land in `assetsDir` via
  Task 4's staging).
- Produces: HTTP GET `/assets/katex/katex.min.css` and
  `/assets/katex/fonts/<name>.woff2` return 200 with content types
  `text/css; charset=utf-8` / `font/woff2`. Anything else under
  `/assets/katex/` (wrong extension, traversal, nested paths) returns 404.

- [ ] **Step 1: Write the failing tests**

In `src/test/unit/server.test.ts`, inside the existing
`describe('PreviewServer')`, extend the `before` hook: after the line that
writes `mermaid.min.js`, add:

```ts
    fs.mkdirSync(path.join(dir, 'assets', 'katex', 'fonts'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'assets', 'katex', 'katex.min.css'), '/* katex stub */');
    fs.writeFileSync(path.join(dir, 'assets', 'katex', 'fonts', 'KaTeX_Main-Regular.woff2'), 'woff2stub');
```

Then add these test cases at the bottom of the describe block:

```ts
  it('serves katex css with text/css', async () => {
    const res = await get(`http://127.0.0.1:${port}/assets/katex/katex.min.css`);
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.includes('katex stub'));
    assert.strictEqual(res.headers['content-type'], 'text/css; charset=utf-8');
  });

  it('serves katex woff2 fonts with font/woff2', async () => {
    const res = await get(`http://127.0.0.1:${port}/assets/katex/fonts/KaTeX_Main-Regular.woff2`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.headers['content-type'], 'font/woff2');
  });

  it('rejects non-whitelisted and traversal paths under /assets/katex/', async () => {
    for (const p of [
      '/assets/katex/evil.js',
      '/assets/katex/fonts/evil.js',
      '/assets/katex/..%2F..%2Fa.md',
      '/assets/katex/fonts/..%2F..%2F..%2Fa.md',
      '/assets/katex/deep/nested/x.woff2',
    ]) {
      const res = await get(`http://127.0.0.1:${port}${p}`);
      assert.strictEqual(res.status, 404, `expected 404 for ${p}`);
    }
  });
```

- [ ] **Step 2: Implement in server.ts**

2a. Below `ASSET_WHITELIST`, add:

```ts
// katex/katex.min.css and katex/fonts/<name>.woff2 only. The single
// character class per segment forbids '/' and any traversal segment.
const KATEX_ASSET_RE = /^katex\/(katex\.min\.css|fonts\/[A-Za-z0-9_-]+\.woff2)$/;
```

2b. Add the woff2 content type to `CONTENT_TYPES`:

```ts
  '.woff2': 'font/woff2',
```

2c. In `handle()`, replace the whitelist check

```ts
        if (!ASSET_WHITELIST.has(name)) {
```

with

```ts
        if (!ASSET_WHITELIST.has(name) && !KATEX_ASSET_RE.test(name)) {
```

and replace the `filePath` line with a separator-safe join:

```ts
        const filePath = path.join(this.opts.assetsDir, ...name.split('/'));
```

- [ ] **Step 3: Compile only**

Run: `npm run compile`
Expected: PASS (0 errors). Do NOT execute server tests in the sandbox — the
host runs them.

- [ ] **Step 4: Commit**

```bash
git add src/server.ts src/test/unit/server.test.ts
git commit -m "feat: serve katex css/fonts from preview server whitelist (OMD-012)"
```

- [ ] **(HOST) Step 5: Host runs the full server suite**

Run: `npx mocha out/test/unit/server.test.js` — all cases incl. the three
new ones pass.

---

### Task 4: Wire katexCss through all three asset surfaces (extension.ts)

**Files:**
- Modify: `src/extension.ts`

**Interfaces:**
- Consumes: `RenderAssets.katexCss` (Task 2), staged `media/katex/**`
  (Task 1), server route `/assets/katex/...` (Task 3).

- [ ] **Step 1: Stage the katex directory**

In the asset-staging block (`// Stage offline assets` — the try that
copies `ASSET_FILES`), add after the `for` loop, inside the same `try`:

```ts
    // katex needs its directory layout preserved (css references fonts/ relatively)
    fs.cpSync(
      path.join(context.extensionPath, 'media', 'katex'),
      path.join(assetsDir, 'katex'),
      { recursive: true }
    );
```

- [ ] **Step 2: Add katexCss to the three RenderAssets objects**

In `browserAssets`:

```ts
    katexCss: vscode.Uri.file(path.join(assetsDir, 'katex', 'katex.min.css')).toString(),
```

In `servedAssets`:

```ts
    katexCss: '/assets/katex/katex.min.css',
```

In `webviewAssets` (inside `renderPreviewPanel`):

```ts
      katexCss: mediaUri('katex/katex.min.css'),
```

- [ ] **Step 3: Compile and run render tests**

Run: `npm run compile && npx mocha "out/test/unit/render*.test.js"`
Expected: PASS, 0 TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add src/extension.ts
git commit -m "feat: stage + link katex assets in browser/served/webview surfaces (OMD-012)"
```

---

### Task 5: Final sandbox verification + handoff notes

- [ ] **Step 1: Full compile + render suite + build**

Run: `npm run compile && npx mocha "out/test/unit/render*.test.js" && npm run build`
Expected: all pass; build prints the size line for
`media/katex/katex.min.css`.

- [ ] **Step 2: Append handoff note**

Append to `WORKING_STATE.md`:

```
- [codex] OMD-012 implementation complete: tasks 1-5 done in sandbox.
  Host still owes: server test suite, integration tests, vsix packaging
  check (media/katex/** present), offline manual test, commits/push.
```

- [ ] **(HOST) Step 3: Host verification**

Host runs: full `npm test` (integration), `npx mocha out/test/unit/**/*.test.js`,
`npm run package` and inspects the vsix for `media/katex/**`, manual
offline preview check (browser + webview, light + dark).

- [ ] **(HOST) Step 4: Feature bookkeeping**

Host updates `harness/feature_list.json` (OMD-012 → done only after all
acceptance criteria verified), `harness/progress.md`, and
`harness/notes/OMD-012.md`.
