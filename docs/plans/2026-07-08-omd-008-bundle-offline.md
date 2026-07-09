# OMD-008: esbuild Bundle + Full Offline Support — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Shrink the vsix from ~24 MB to ≤3 MB via esbuild bundling and make Mermaid + syntax highlighting work fully offline by shipping assets locally.

**Architecture:** Extension code bundles to a single `dist/extension.js` (esbuild, node/cjs, `vscode` external). Browser/webview assets (mermaid, a self-built hljs browser bundle, 2 hljs CSS themes) are staged into `media/` at build time; on activate they are copied to `<extension>/.temp/assets/` (after the v1.0.0 global cleanup, which also deletes the current version's `.temp`). Rendering moves to a vscode-free `src/render.ts` exposing one `generateHtml()` — the two existing 500-line HTML templates are byte-identical, so this is a pure dedup. Callers pass asset URIs: `file://` paths (browser) or `asWebviewUri` (webview).

**Tech Stack:** TypeScript, esbuild, markdown-it, mermaid 11 (`node_modules/mermaid/dist/mermaid.min.js`, 2.6 MB), highlight.js 11 (`lib/common` bundled to IIFE), mocha (unit tests, run directly on compiled output — no VS Code host needed).

## Global Constraints

- vsix ≤ 3 MB (spec success criterion)
- No `http://`/`https://` URLs in any generated HTML
- No new runtime dependencies (esbuild is devDependency only)
- Asset copy to `.temp/assets/` MUST run AFTER the v1.0.0 cleanup loop in `activate()` (the cleanup deletes `.temp` for ALL versions including the current one)
- `src/render.ts` MUST NOT import `vscode` (keeps it unit-testable without an extension host)
- Do not change rendering behavior: markdown-it plugin set, template CSS/JS stay as-is except CDN URL replacement
- Existing repo convention: commit messages without ticket prefix, no Co-Authored-By

---

### Task 1: esbuild build pipeline + `media/` assets

**Files:**
- Create: `esbuild.js`
- Create: `build/hljs-entry.js`
- Modify: `package.json` (main, scripts, devDependencies)
- Modify: `.vscodeignore`
- Modify: `.gitignore` (ignore `dist/` and `media/` — both are build outputs)

**Interfaces:**
- Consumes: nothing (first task)
- Produces: `npm run build` → `dist/extension.js`, `media/mermaid.min.js`, `media/highlight.min.js`, `media/github.min.css`, `media/github-dark.min.css`. Task 3 relies on these exact `media/` file names; Task 4 relies on `vscode:prepublish` running the build.

- [x] **Step 1: Install esbuild**

Run: `npm install --save-dev esbuild`
Expected: added to `devDependencies`, exit 0.

- [x] **Step 2: Create the hljs browser entry**

`build/hljs-entry.js`:
```js
// Bundled by esbuild into media/highlight.min.js (IIFE).
// highlight.js's npm package has no single-file browser build, so we make our
// own from lib/common (same ~40 languages as the CDN "common" build).
import hljs from 'highlight.js/lib/common';
window.hljs = hljs;
```

- [x] **Step 3: Create `esbuild.js`**

```js
const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

async function main() {
  fs.mkdirSync('media', { recursive: true });

  // 1. Extension code → dist/extension.js
  await esbuild.build({
    entryPoints: ['src/extension.ts'],
    bundle: true,
    outfile: 'dist/extension.js',
    platform: 'node',
    format: 'cjs',
    external: ['vscode'],
    minify: true,
    sourcemap: false,
  });

  // 2. hljs browser bundle → media/highlight.min.js
  await esbuild.build({
    entryPoints: ['build/hljs-entry.js'],
    bundle: true,
    outfile: 'media/highlight.min.js',
    platform: 'browser',
    format: 'iife',
    minify: true,
  });

  // 3. Copy static assets
  const copies = [
    ['node_modules/mermaid/dist/mermaid.min.js', 'media/mermaid.min.js'],
    ['node_modules/highlight.js/styles/github.min.css', 'media/github.min.css'],
    ['node_modules/highlight.js/styles/github-dark.min.css', 'media/github-dark.min.css'],
  ];
  for (const [src, dest] of copies) {
    fs.copyFileSync(src, dest);
  }

  for (const f of ['dist/extension.js', 'media/mermaid.min.js', 'media/highlight.min.js', 'media/github.min.css', 'media/github-dark.min.css']) {
    const kb = Math.round(fs.statSync(f).size / 1024);
    console.log(`${f}  ${kb} KB`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
```

- [x] **Step 4: Update `package.json`**

Change `"main": "./out/extension.js"` → `"main": "./dist/extension.js"`.
In `scripts`, change `"vscode:prepublish": "npm run compile"` → `"vscode:prepublish": "npm run build"` and add `"build": "node esbuild.js"`.
Keep `"compile": "tsc -p ./"` — tsc still compiles `out/` for tests.

- [x] **Step 5: Update `.vscodeignore`**

Replace the whole file with (node_modules is now safe to exclude because `dist/extension.js` is self-contained — this permanently closes the v0.1.6 broken-package regression):
```
.vscode/**
.vscode-test/**
.git/**
.claude/**
src/**
out/**
build/**
docs/**
harness/**
node_modules/**
.temp/**
.gitignore
.yarnrc
vsc-extension-quickstart.md
generate-icon.js
esbuild.js
**/tsconfig.json
**/.eslintrc.json
**/*.map
**/*.ts
test-features.md
*.vsix
DEVELOPMENT.md
TESTING.md
CLAUDE.md
AGENTS.md
init.sh
icon.svg
package-lock.json
```

- [x] **Step 6: Add build outputs to `.gitignore`**

Append:
```
dist/
media/
```

- [x] **Step 7: Verify the build runs**

Run: `npm run build`
Expected: prints the five files with sizes; `media/highlight.min.js` roughly 100–200 KB, `media/mermaid.min.js` ~2.6 MB, `dist/extension.js` well under 1 MB. All five files exist.

- [x] **Step 8: Commit**

```bash
git add esbuild.js build/hljs-entry.js package.json package-lock.json .vscodeignore .gitignore
git commit -m "build: add esbuild bundling and local asset staging"
```

---

### Task 2: Extract vscode-free `src/render.ts` with unit tests

**Files:**
- Create: `src/render.ts`
- Create: `src/test/unit/render.test.ts`
- Modify: `package.json` (add `test:unit` script)
- Reference (do not modify yet): `src/extension.ts:177-237` (`createMarkdownParser`), `src/extension.ts:239-263` (render wrappers), `src/extension.ts:266-763` (`getHtmlTemplate` — byte-identical to `getWebviewTemplate` at 766-1263)

**Interfaces:**
- Consumes: nothing from other tasks (pure move + parameterization)
- Produces (Task 3 calls exactly this):
```ts
// src/render.ts
export interface RenderAssets {
  mermaidJs: string;     // URI string for mermaid.min.js
  hljsJs: string;        // URI string for highlight.min.js
  hljsCssLight: string;  // URI string for github.min.css
  hljsCssDark: string;   // URI string for github-dark.min.css
}
export function createMarkdownParser(): MarkdownIt;
export function generateHtml(markdown: string, title: string, assets: RenderAssets, md: MarkdownIt): string;
```

- [x] **Step 1: Add the unit-test script**

In `package.json` scripts add:
```json
"test:unit": "npm run compile && mocha out/test/unit/**/*.test.js"
```

- [x] **Step 2: Write the failing test**

`src/test/unit/render.test.ts`:
```ts
import * as assert from 'assert';
import { createMarkdownParser, generateHtml, RenderAssets } from '../../render';

const ASSETS: RenderAssets = {
  mermaidJs: 'file:///assets/mermaid.min.js',
  hljsJs: 'file:///assets/highlight.min.js',
  hljsCssLight: 'file:///assets/github.min.css',
  hljsCssDark: 'file:///assets/github-dark.min.css',
};

describe('generateHtml', () => {
  const md = createMarkdownParser();

  it('contains no CDN / network URLs', () => {
    const html = generateHtml('# hi', 'hi', ASSETS, md);
    assert.ok(!/https?:\/\//.test(html.replace(/href="#/g, '')),
      'generated HTML must not reference the network');
  });

  it('references all four local assets', () => {
    const html = generateHtml('# hi', 'hi', ASSETS, md);
    for (const uri of Object.values(ASSETS)) {
      assert.ok(html.includes(uri), `missing asset ${uri}`);
    }
  });

  it('renders mermaid fences as <pre class="mermaid">', () => {
    const html = generateHtml('```mermaid\nflowchart TD\nA-->B\n```', 't', ASSETS, md);
    assert.ok(html.includes('<pre class="mermaid">'));
  });

  it('renders code fences with language class for client-side hljs', () => {
    const html = generateHtml('```js\nconst x = 1;\n```', 't', ASSETS, md);
    assert.ok(html.includes('language-js'));
  });

  it('renders GitHub alerts', () => {
    const html = generateHtml('> [!NOTE]\n> hi', 't', ASSETS, md);
    assert.ok(html.includes('markdown-alert'));
  });
});
```

- [x] **Step 3: Run to verify it fails**

Run: `npm run test:unit`
Expected: FAIL — TypeScript compile error, `src/render.ts` does not exist.

- [x] **Step 4: Create `src/render.ts`**

Move code out of `src/extension.ts` (copy only — extension.ts is cleaned up in Task 3):
1. Top of file — imports (no `vscode`):
```ts
import MarkdownIt from 'markdown-it';
import markdownItAttrs from 'markdown-it-attrs';
import markdownItTaskLists from 'markdown-it-task-lists';
import markdownItGithubAlerts from 'markdown-it-github-alerts';
import markdownItAnchor from 'markdown-it-anchor';
import markdownItEmoji from 'markdown-it-emoji';

export interface RenderAssets {
  mermaidJs: string;
  hljsJs: string;
  hljsCssLight: string;
  hljsCssDark: string;
}
```
2. Copy `createMarkdownParser()` from `src/extension.ts:178-237` verbatim, prefix with `export`.
3. Add `generateHtml` wrapping the moved template:
```ts
export function generateHtml(
  markdown: string,
  title: string,
  assets: RenderAssets,
  md: MarkdownIt
): string {
  const body = md.render(markdown);
  return htmlTemplate(body, title, assets);
}
```
4. Copy `getHtmlTemplate` from `src/extension.ts:266-763` verbatim, renamed to `private` module function `htmlTemplate(body: string, title: string, assets: RenderAssets)`, with EXACTLY these four line replacements (the only CDN references):
   - line 275 `<link rel="stylesheet" href="https://cdnjs...github.min.css" ...>` → `<link rel="stylesheet" href="${assets.hljsCssLight}" media="(prefers-color-scheme: light)">`
   - line 276 dark CSS → `<link rel="stylesheet" href="${assets.hljsCssDark}" media="(prefers-color-scheme: dark)">`
   - line 279 mermaid script → `<script src="${assets.mermaidJs}"></script>`
   - line 615 hljs script → `<script src="${assets.hljsJs}"></script>`

Everything else in the template (CSS, theme toggle, emoji script, copy-button script) is moved unchanged.

- [x] **Step 5: Run tests to verify they pass**

Run: `npm run test:unit`
Expected: 5 passing.

- [x] **Step 6: Commit**

```bash
git add src/render.ts src/test/unit/render.test.ts package.json
git commit -m "refactor: extract vscode-free render module with local asset URIs"
```

---

### Task 3: Wire `extension.ts` to render.ts + stage assets on activate

**Files:**
- Modify: `src/extension.ts` (activate + both commands; DELETE lines 177-1265: `createMarkdownParser`, `markdownToHtml`, `markdownToWebviewHtml`, `getHtmlTemplate`, `getWebviewTemplate`)

**Interfaces:**
- Consumes: `createMarkdownParser()`, `generateHtml(markdown, title, assets, md)`, `RenderAssets` from `./render` (Task 2); `media/*` file names (Task 1)
- Produces: working extension — no other task consumes code from this one

- [x] **Step 1: Replace markdown-it imports with the render module**

At the top of `src/extension.ts`, delete the six markdown-it/plugin imports (lines 4-9) and add:
```ts
import { createMarkdownParser, generateHtml, RenderAssets } from './render';
```

- [x] **Step 2: Stage assets in `activate()` AFTER the cleanup loop**

Immediately after the v1.0.0 cleanup `try/catch` block (after `src/extension.ts:41`) and before `const md = createMarkdownParser();`, insert:
```ts
  // Stage offline assets — MUST run after the cleanup above, which deletes
  // .temp for every version including this one.
  const assetsDir = path.join(context.extensionPath, '.temp', 'assets');
  const ASSET_FILES = ['mermaid.min.js', 'highlight.min.js', 'github.min.css', 'github-dark.min.css'];
  try {
    fs.mkdirSync(assetsDir, { recursive: true });
    for (const f of ASSET_FILES) {
      fs.copyFileSync(path.join(context.extensionPath, 'media', f), path.join(assetsDir, f));
    }
  } catch (err) {
    console.error('[OpenMD] Failed to stage assets:', err);
  }

  const browserAssets: RenderAssets = {
    mermaidJs: vscode.Uri.file(path.join(assetsDir, 'mermaid.min.js')).toString(),
    hljsJs: vscode.Uri.file(path.join(assetsDir, 'highlight.min.js')).toString(),
    hljsCssLight: vscode.Uri.file(path.join(assetsDir, 'github.min.css')).toString(),
    hljsCssDark: vscode.Uri.file(path.join(assetsDir, 'github-dark.min.css')).toString(),
  };
```

- [x] **Step 3: Use `generateHtml` in the browser command**

In the `openmd.openBrowser` handler, replace `const html = markdownToHtml(content, fileUri, md);` with:
```ts
        const html = generateHtml(content, path.basename(fileUri.fsPath, '.md'), browserAssets, md);
```

- [x] **Step 4: Use `generateHtml` in the preview command**

In `openmd.openPreview`:
1. In `createWebviewPanel` options, extend `localResourceRoots`:
```ts
              localResourceRoots: [
                vscode.Uri.file(path.dirname(fileUri.fsPath)),
                vscode.Uri.joinPath(context.extensionUri, 'media')
              ]
```
2. Replace `const html = markdownToWebviewHtml(content, fileUri, currentPanel, md);` with:
```ts
        const mediaUri = (f: string) =>
          currentPanel!.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'media', f)).toString();
        const webviewAssets: RenderAssets = {
          mermaidJs: mediaUri('mermaid.min.js'),
          hljsJs: mediaUri('highlight.min.js'),
          hljsCssLight: mediaUri('github.min.css'),
          hljsCssDark: mediaUri('github-dark.min.css'),
        };
        const html = generateHtml(content, path.basename(fileUri.fsPath, '.md'), webviewAssets, md);
```
Note: the panel-reuse path must also get these assets — build `webviewAssets` after the `if (currentPanel) / else` block, right before `currentPanel.webview.html = html;`.

- [x] **Step 5: Delete the moved code**

Delete from `src/extension.ts`: `createMarkdownParser`, `markdownToHtml`, `markdownToWebviewHtml`, `getHtmlTemplate`, `getWebviewTemplate` (everything from the `// สร้าง markdown-it instance พร้อม plugins` comment at line 177 to end of file). The file should end after `activate()`'s closing brace plus an empty `export function deactivate() {}` if present.

- [x] **Step 6: Verify everything compiles and tests pass**

Run: `npm run compile && npm run test:unit && npm run build`
Expected: tsc clean, 5 unit tests passing, esbuild outputs written. `grep -c "cdnjs\|jsdelivr" src/extension.ts src/render.ts` → `src/extension.ts:0`, `src/render.ts:0`.

- [x] **Step 7: Manual smoke test in the Extension Development Host**

Press F5 in VS Code (or `code --extensionDevelopmentPath=.`), open `test-features.md`, run both commands.
Expected: browser page and preview panel render Mermaid diagram + highlighted code. Browser page source references `file:///.../​.temp/assets/...`, not CDN.

- [x] **Step 8: Commit**

```bash
git add src/extension.ts
git commit -m "feat: render offline from local assets; remove duplicate HTML templates"
```

---

### Task 4: Package, verify size + offline behavior, close out OMD-008

**Files:**
- Modify: `CHANGELOG.md`, `package.json` (version → 1.1.0)
- Modify: `harness/feature_list.json`, `harness/progress.md`, `harness/notes/OMD-008.md`

**Interfaces:**
- Consumes: `vscode:prepublish` → `npm run build` (Task 1); complete wiring (Task 3)
- Produces: `openmd-1.1.0.vsix` ready for the OMD-009 work to build on

- [x] **Step 1: Bump version and changelog**

`package.json`: `"version": "1.1.0"`. `CHANGELOG.md`, add on top:
```markdown
## [1.1.0] - 2026-07-08

### Changed
- 📦 **Tiny package** - Bundled with esbuild; vsix shrinks from ~24 MB to ~3 MB
- 🔌 **Works offline** - Mermaid and syntax highlighting no longer load from CDN

```

- [x] **Step 2: Package**

Run: `npm run package` (runs `vsce package`, which triggers `vscode:prepublish` → build)
Expected: `openmd-1.1.0.vsix` created.

- [x] **Step 3: Verify size and contents**

Run: `ls -lh openmd-1.1.0.vsix && npx vsce ls | head -30`
Expected: size ≤ 3 MB. Listing contains `dist/extension.js` and the four `media/` files; NO `node_modules/` entries.

- [x] **Step 4: Verify offline acceptance criterion**

Install: `code --install-extension openmd-1.1.0.vsix`. Turn off Wi-Fi (or use browser devtools → Network → Offline on the opened page). Open a .md with mermaid + code fences; run both commands.
Expected: diagrams and highlighting render with networking disabled.

- [x] **Step 5: Update harness memory**

`harness/feature_list.json`: OMD-008 `"status": "done"`. `harness/progress.md`: update Current State (OMD-008 shipped, next OMD-009) and Feature index row. `harness/notes/OMD-008.md`: status done + record actual vsix size and any surprises.

- [x] **Step 6: Commit**

```bash
git add package.json CHANGELOG.md harness/ openmd-1.1.0.vsix
git commit -m "Release v1.1.0: esbuild bundle + full offline support"
```
(Repo convention keeps the vsix in git per the user's earlier decision. Do NOT publish — `vsce publish`/`ovsx publish` requires explicit human approval per harness checkpoints.)
