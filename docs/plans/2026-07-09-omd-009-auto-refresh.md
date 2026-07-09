# OMD-009: Auto-refresh on Save — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Saving a Markdown file updates the preview panel immediately and reloads the browser preview within 1-2 s, preserving scroll position.

**Architecture:** A vscode-free `PreviewServer` (`src/server.ts`, Node built-in `http` only) serves rendered pages at `http://127.0.0.1:<os-assigned-port>/<mirror-path>.html`, rendering Markdown fresh on every request. Pages get an injected poll script (`generateHtml` gains an optional `live` option) that fetches `/mtime` every 1 s and reloads on change, stashing scroll position in sessionStorage. CRITICAL: pages served over http:// cannot load `file://` subresources (browsers block it) — served pages must reference assets as `/assets/<name>`, which the server streams from `.temp/assets/`. The preview panel needs no server: an `onDidSaveTextDocument` listener re-renders the webview. If the server fails to start, "Open in Browser" falls back to the existing v1.0.0 temp-file flow with a warning.

**Tech Stack:** TypeScript, Node built-in `http`/`fs`/`path`, existing `src/render.ts` (`generateHtml`), mocha unit tests via `npm run test:unit`.

## Global Constraints

- No new dependencies (runtime or dev) — Node built-in `http` only, no WebSocket
- Server binds to `127.0.0.1` ONLY and listens on port 0 (OS-assigned) — never `0.0.0.0`
- Server must only serve registered mappings and whitelisted asset names — never arbitrary filesystem paths
- `src/render.ts` and `src/server.ts` MUST NOT import `vscode`
- Poll interval 1 s; reload preserves scroll via sessionStorage
- On server-start failure: fall back to temp-file flow + `vscode.window.showWarningMessage`
- Existing repo conventions: commit messages without ticket prefix, no Co-Authored-By; never push/publish

---

### Task 1: Live-reload script injection in `render.ts`

**Files:**
- Modify: `src/render.ts` (`generateHtml` at line 81, `htmlTemplate` at line 91, `</body>` at line 586)
- Modify: `src/test/unit/render.test.ts`

**Interfaces:**
- Consumes: existing `generateHtml(markdown, title, assets, md)` and `RenderAssets`
- Produces (Tasks 2-3 rely on this exact signature — a new OPTIONAL 5th param, existing callers unchanged):
```ts
export interface LiveReloadOptions { mtimeUrl: string; }  // e.g. '/mtime?f=%2Fdocs%2Fa.html'
export function generateHtml(markdown: string, title: string, assets: RenderAssets, md: MarkdownIt, live?: LiveReloadOptions): string;
```

- [ ] **Step 1: Write the failing tests**

Append to `src/test/unit/render.test.ts` inside `describe('generateHtml', ...)`:
```ts
  it('injects the live-reload poll script when live option is set', () => {
    const html = generateHtml('# hi', 'hi', ASSETS, md, { mtimeUrl: '/mtime?f=%2Fa.html' });
    assert.ok(html.includes('/mtime?f=%2Fa.html'), 'must poll the given mtime URL');
    assert.ok(html.includes('sessionStorage'), 'must preserve scroll via sessionStorage');
    assert.ok(html.includes('location.reload'), 'must reload on change');
  });

  it('omits the live-reload script by default', () => {
    const html = generateHtml('# hi', 'hi', ASSETS, md);
    assert.ok(!html.includes('location.reload'));
    assert.ok(!html.includes('/mtime'));
  });
```
(Import `LiveReloadOptions` is not needed — the object literal is inferred.)

- [ ] **Step 2: Run tests to verify the new ones fail**

Run: `npm run test:unit`
Expected: 5 passing, 2 failing (TS error: `generateHtml` takes 4 arguments).

- [ ] **Step 3: Implement the injection**

In `src/render.ts`:
1. Below `RenderAssets`, add:
```ts
export interface LiveReloadOptions {
  /** URL the page polls for the source file's last-modified time, e.g. '/mtime?f=%2Fdocs%2Fa.html' */
  mtimeUrl: string;
}

function liveReloadScript(mtimeUrl: string): string {
  return `
    <script>
        // OpenMD live reload: poll mtime every 1s, reload on change, keep scroll
        (function() {
            var KEY = 'openmd-scroll:' + location.pathname;
            var saved = sessionStorage.getItem(KEY);
            if (saved !== null) {
                window.scrollTo(0, parseInt(saved, 10));
                sessionStorage.removeItem(KEY);
            }
            var last = null;
            var timer = setInterval(function() {
                fetch(${JSON.stringify(mtimeUrl)})
                    .then(function(r) { if (!r.ok) { throw new Error('gone'); } return r.json(); })
                    .then(function(d) {
                        if (last === null) { last = d.mtime; return; }
                        if (d.mtime !== last) {
                            sessionStorage.setItem(KEY, String(window.scrollY));
                            location.reload();
                        }
                    })
                    .catch(function() { clearInterval(timer); });
            }, 1000);
        })();
    </script>`;
}
```
2. Change `generateHtml` to:
```ts
export function generateHtml(
  markdown: string,
  title: string,
  assets: RenderAssets,
  md: MarkdownIt,
  live?: LiveReloadOptions
): string {
  const body = md.render(markdown);
  return htmlTemplate(body, title, assets, live);
}
```
3. Change `htmlTemplate` signature to `(body: string, title: string, assets: RenderAssets, live?: LiveReloadOptions)` and change the template's closing (line 586) from:
```
</body>
```
to:
```
${live ? liveReloadScript(live.mtimeUrl) : ''}
</body>
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test:unit`
Expected: 7 passing.

- [ ] **Step 5: Commit**

```bash
git add src/render.ts src/test/unit/render.test.ts
git commit -m "feat: optional live-reload poll script in generated HTML"
```

---

### Task 2: `PreviewServer` module with unit tests

**Files:**
- Create: `src/server.ts`
- Create: `src/test/unit/server.test.ts`

**Interfaces:**
- Consumes: nothing from vscode; caller supplies a render callback
- Produces (Task 3 calls exactly this):
```ts
// src/server.ts
export interface PreviewServerOptions {
  assetsDir: string;                                        // absolute path to .temp/assets
  renderFile: (sourcePath: string, urlPath: string) => string; // returns full HTML for a registered page
}
export class PreviewServer {
  constructor(opts: PreviewServerOptions);
  start(): Promise<number>;                  // resolves the OS-assigned port; rejects on failure
  stop(): void;
  register(urlPath: string, sourcePath: string): void;  // e.g. ('/Project/OpenMD/README.html', '/abs/README.md')
  url(urlPath: string): string;              // 'http://127.0.0.1:<port><urlPath>' — throws if not started
}
```

- [ ] **Step 1: Write the failing tests**

`src/test/unit/server.test.ts`:
```ts
import * as assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as http from 'http';
import { PreviewServer } from '../../server';

function get(url: string): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () => resolve({ status: res.statusCode || 0, body }));
    }).on('error', reject);
  });
}

describe('PreviewServer', () => {
  let dir: string;
  let mdFile: string;
  let server: PreviewServer;
  let port: number;

  before(async () => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'openmd-test-'));
    mdFile = path.join(dir, 'a.md');
    fs.writeFileSync(mdFile, '# hello');
    fs.mkdirSync(path.join(dir, 'assets'));
    fs.writeFileSync(path.join(dir, 'assets', 'mermaid.min.js'), '// mermaid stub');
    server = new PreviewServer({
      assetsDir: path.join(dir, 'assets'),
      renderFile: (sourcePath) => `<html>${fs.readFileSync(sourcePath, 'utf-8')}</html>`,
    });
    port = await server.start();
    server.register('/proj/a.html', mdFile);
  });

  after(() => server.stop());

  it('serves a registered page rendered fresh on each request', async () => {
    const res = await get(`http://127.0.0.1:${port}/proj/a.html`);
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.includes('# hello'));
    fs.writeFileSync(mdFile, '# changed');
    const res2 = await get(`http://127.0.0.1:${port}/proj/a.html`);
    assert.ok(res2.body.includes('# changed'), 'must re-render, not cache');
  });

  it('returns 404 for unregistered paths', async () => {
    const res = await get(`http://127.0.0.1:${port}/etc/passwd`);
    assert.strictEqual(res.status, 404);
  });

  it('serves whitelisted assets and rejects traversal', async () => {
    const ok = await get(`http://127.0.0.1:${port}/assets/mermaid.min.js`);
    assert.strictEqual(ok.status, 200);
    assert.ok(ok.body.includes('mermaid stub'));
    const bad = await get(`http://127.0.0.1:${port}/assets/..%2F..%2Fa.md`);
    assert.strictEqual(bad.status, 404);
  });

  it('reports mtime for registered pages and changes after edit', async () => {
    const r1 = await get(`http://127.0.0.1:${port}/mtime?f=${encodeURIComponent('/proj/a.html')}`);
    assert.strictEqual(r1.status, 200);
    const m1 = JSON.parse(r1.body).mtime;
    assert.strictEqual(typeof m1, 'number');
    fs.utimesSync(mdFile, new Date(), new Date(Date.now() + 5000));
    const r2 = await get(`http://127.0.0.1:${port}/mtime?f=${encodeURIComponent('/proj/a.html')}`);
    assert.notStrictEqual(JSON.parse(r2.body).mtime, m1);
  });

  it('url() builds a loopback URL', () => {
    assert.strictEqual(server.url('/proj/a.html'), `http://127.0.0.1:${port}/proj/a.html`);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test:unit`
Expected: FAIL — `src/server.ts` does not exist.

- [ ] **Step 3: Implement `src/server.ts`**

```ts
// Minimal localhost preview server. No vscode imports — unit-testable.
import * as fs from 'fs';
import * as http from 'http';
import * as path from 'path';
import * as url from 'url';

export interface PreviewServerOptions {
  assetsDir: string;
  renderFile: (sourcePath: string, urlPath: string) => string;
}

const ASSET_WHITELIST = new Set([
  'mermaid.min.js',
  'highlight.min.js',
  'github.min.css',
  'github-dark.min.css',
]);

const CONTENT_TYPES: Record<string, string> = {
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
};

export class PreviewServer {
  private server: http.Server | undefined;
  private port: number | undefined;
  private pages = new Map<string, string>(); // urlPath -> absolute source .md path

  constructor(private opts: PreviewServerOptions) {}

  start(): Promise<number> {
    return new Promise((resolve, reject) => {
      const server = http.createServer((req, res) => this.handle(req, res));
      server.once('error', reject);
      server.listen(0, '127.0.0.1', () => {
        this.server = server;
        const addr = server.address();
        this.port = typeof addr === 'object' && addr ? addr.port : undefined;
        if (this.port === undefined) {
          reject(new Error('no port assigned'));
        } else {
          resolve(this.port);
        }
      });
    });
  }

  stop(): void {
    this.server?.close();
    this.server = undefined;
    this.port = undefined;
  }

  register(urlPath: string, sourcePath: string): void {
    this.pages.set(urlPath, sourcePath);
  }

  url(urlPath: string): string {
    if (this.port === undefined) {
      throw new Error('PreviewServer not started');
    }
    return `http://127.0.0.1:${this.port}${urlPath}`;
  }

  private handle(req: http.IncomingMessage, res: http.ServerResponse): void {
    const parsed = url.parse(req.url || '/', true);
    const pathname = decodeURIComponent(parsed.pathname || '/');
    try {
      if (pathname === '/mtime') {
        const f = String(parsed.query.f || '');
        const source = this.pages.get(f);
        if (!source || !fs.existsSync(source)) {
          res.writeHead(404).end();
          return;
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ mtime: fs.statSync(source).mtimeMs }));
        return;
      }
      if (pathname.startsWith('/assets/')) {
        const name = pathname.slice('/assets/'.length);
        if (!ASSET_WHITELIST.has(name)) {
          res.writeHead(404).end();
          return;
        }
        const filePath = path.join(this.opts.assetsDir, name);
        res.writeHead(200, { 'Content-Type': CONTENT_TYPES[path.extname(name)] || 'application/octet-stream' });
        fs.createReadStream(filePath).pipe(res);
        return;
      }
      const source = this.pages.get(pathname);
      if (!source || !fs.existsSync(source)) {
        res.writeHead(404).end();
        return;
      }
      res.writeHead(200, { 'Content-Type': CONTENT_TYPES['.html'] });
      res.end(this.opts.renderFile(source, pathname));
    } catch (err) {
      res.writeHead(500).end(String(err));
    }
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test:unit`
Expected: 12 passing (7 render + 5 server).

- [ ] **Step 5: Commit**

```bash
git add src/server.ts src/test/unit/server.test.ts
git commit -m "feat: add minimal loopback preview server with mtime polling"
```

---

### Task 3: Wire auto-refresh into `extension.ts`

**Files:**
- Modify: `src/extension.ts` (all references below are to its current 200-line form on main)

**Interfaces:**
- Consumes: `PreviewServer` (Task 2), `generateHtml(..., live?)` (Task 1), existing `browserAssets` staging and mirror-path logic (`src/extension.ts:75-116`)
- Produces: user-facing behavior only

- [ ] **Step 1: Extract the mirror-path computation**

Move the mirror-path block (currently inline in the `openmd.openBrowser` handler, `src/extension.ts:78-116` from `let relativePath: string;` through `const htmlRelativePath = ...`) into a module-level function, unchanged logic:
```ts
// คำนวณ mirror path ของไฟล์ (เช่น /Users/x/Project/OpenMD/README.md → Project/OpenMD/README.html)
function computeMirrorHtmlPath(fileUri: vscode.Uri): string {
  // ...moved code, ending with:
  return relativePath.replace(/\.md$/i, '.html');
}
```

- [ ] **Step 2: Add the lazy server + serve pages over http**

At the top of `extension.ts` add `import { PreviewServer } from './server';`.

Inside `activate()`, after `browserAssets` is defined, add:
```ts
  // Assets referenced by pages served over http:// (file:// subresources are blocked there)
  const servedAssets: RenderAssets = {
    mermaidJs: '/assets/mermaid.min.js',
    hljsJs: '/assets/highlight.min.js',
    hljsCssLight: '/assets/github.min.css',
    hljsCssDark: '/assets/github-dark.min.css',
  };

  let previewServer: PreviewServer | undefined;
  async function ensureServer(): Promise<PreviewServer | undefined> {
    if (previewServer) {
      return previewServer;
    }
    const server = new PreviewServer({
      assetsDir,
      renderFile: (sourcePath, urlPath) =>
        generateHtml(
          fs.readFileSync(sourcePath, 'utf-8'),
          path.basename(sourcePath, '.md'),
          servedAssets,
          md,
          { mtimeUrl: `/mtime?f=${encodeURIComponent(urlPath)}` }
        ),
    });
    try {
      await server.start();
      previewServer = server;
      context.subscriptions.push({ dispose: () => server.stop() });
      return previewServer;
    } catch (err) {
      console.error('[OpenMD] Preview server failed to start:', err);
      return undefined;
    }
  }
```

- [ ] **Step 3: Rewrite the `openmd.openBrowser` handler body**

Replace the handler's `try` block with (the temp-file code moves into the fallback branch, using the extracted `computeMirrorHtmlPath`):
```ts
      try {
        const server = await ensureServer();
        if (server) {
          const urlPath = '/' + computeMirrorHtmlPath(fileUri).split(path.sep).join('/');
          server.register(urlPath, fileUri.fsPath);
          await vscode.env.openExternal(vscode.Uri.parse(server.url(urlPath)));
          return;
        }

        // Fallback: static temp file (v1.0.0 behavior, no auto-refresh)
        vscode.window.showWarningMessage('OpenMD: live preview server unavailable — opening static preview instead.');
        const content = fs.readFileSync(fileUri.fsPath, 'utf-8');
        const html = generateHtml(content, path.basename(fileUri.fsPath, '.md'), browserAssets, md);
        const tempHtmlPath = path.join(context.extensionPath, '.temp', computeMirrorHtmlPath(fileUri));
        fs.mkdirSync(path.dirname(tempHtmlPath), { recursive: true });
        fs.writeFileSync(tempHtmlPath, html);
        await vscode.env.openExternal(vscode.Uri.file(tempHtmlPath));
      } catch (error) {
        vscode.window.showErrorMessage(`Error: ${error}`);
      }
```

- [ ] **Step 4: Preview panel re-render on save**

1. Add module-level tracking next to `currentPanel`:
```ts
let currentPreviewSource: vscode.Uri | undefined = undefined;
```
2. In the `openmd.openPreview` handler, extract the render into a closure and record the source. Replace everything from `const mediaUri = ...` through `currentPanel.webview.html = html;` with:
```ts
        currentPreviewSource = fileUri;
        renderPreviewPanel(fileUri);
```
and add inside `activate()` (after `ensureServer`):
```ts
  function renderPreviewPanel(fileUri: vscode.Uri): void {
    if (!currentPanel) {
      return;
    }
    const mediaUri = (f: string) =>
      currentPanel!.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'media', f)).toString();
    const webviewAssets: RenderAssets = {
      mermaidJs: mediaUri('mermaid.min.js'),
      hljsJs: mediaUri('highlight.min.js'),
      hljsCssLight: mediaUri('github.min.css'),
      hljsCssDark: mediaUri('github-dark.min.css'),
    };
    const content = fs.readFileSync(fileUri.fsPath, 'utf-8');
    currentPanel.webview.html = generateHtml(content, path.basename(fileUri.fsPath, '.md'), webviewAssets, md);
  }
```
3. In the panel's `onDidDispose` callback, also set `currentPreviewSource = undefined;`.
4. Register the save listener at the end of `activate()`:
```ts
  const onSave = vscode.workspace.onDidSaveTextDocument((doc) => {
    if (currentPanel && currentPreviewSource && doc.uri.fsPath === currentPreviewSource.fsPath) {
      renderPreviewPanel(currentPreviewSource);
    }
  });
  context.subscriptions.push(onSave);
```

- [ ] **Step 5: Verify compile, tests, build**

Run: `npm run compile && npm run test:unit && npm run build`
Expected: tsc clean, 12 tests passing, esbuild outputs written.

- [ ] **Step 6: Manual smoke test (human)**

F5 → open `test-features.md` → Open in Browser (URL must be `http://127.0.0.1:...`) → edit + save → browser reloads within 2 s keeping scroll. Open in Preview → edit + save → panel updates instantly. Also verify Mermaid/highlighting still render on the served page.

- [ ] **Step 7: Commit**

```bash
git add src/extension.ts
git commit -m "feat: auto-refresh previews on save via loopback server and save listener"
```

---

### Task 4: Release prep + close out OMD-009

**Files:**
- Modify: `package.json` (version → 1.2.0), `CHANGELOG.md`
- Modify: `harness/feature_list.json`, `harness/progress.md`, `harness/notes/OMD-009.md`

**Interfaces:**
- Consumes: everything above complete
- Produces: `openmd-1.2.0.vsix`

- [ ] **Step 1: Bump version and changelog**

`package.json`: `"version": "1.2.0"`. `CHANGELOG.md`, add on top:
```markdown
## [1.2.0] - 2026-07-09

### Added
- 🔄 **Auto-refresh** - Save the file and the browser preview reloads within 1-2 s (scroll preserved); the VS Code preview panel updates instantly
- 🌐 Browser preview now served from a local-only server (127.0.0.1) instead of static temp files

```

- [ ] **Step 2: Package and verify**

Run: `npm run package && ls -lh openmd-1.2.0.vsix`
Expected: vsix created, still ~1 MB.

- [ ] **Step 3: Update harness memory**

`harness/feature_list.json`: OMD-009 `"status": "done"` (only after the manual smoke test in Task 3 Step 6 passed). `harness/progress.md`: update Current State + Feature index. `harness/notes/OMD-009.md`: record surprises.

- [ ] **Step 4: Commit**

```bash
git add package.json CHANGELOG.md harness/ openmd-1.2.0.vsix
git commit -m "Release v1.2.0: auto-refresh previews on save"
```
(Do NOT publish — `vsce publish`/`ovsx publish` requires explicit human approval.)
