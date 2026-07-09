# OMD-006: Unit Test Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Grow the fast unit suite from 12 to 25 tests covering the whole markdown render pipeline, fixing the unescaped-page-title bug the new tests expose.

**Architecture:** One new mocha test file (`src/test/unit/render-features.test.ts`) exercising `generateHtml` output strings — no VS Code host, runs via the existing `npm run test:unit`. The title-escaping test will fail against current code (`htmlTemplate` interpolates `${title}` raw into `<title>`); the fix is a small `escapeHtml` helper in `src/render.ts`.

**Tech Stack:** TypeScript, mocha + node assert (existing pattern in `src/test/unit/render.test.ts`), markdown-it plugins already configured in `createMarkdownParser` (`src/render.ts:53`).

## Global Constraints

- No new dependencies
- Tests must run with `npm run test:unit` (compiles with tsc, runs mocha on `out/test/unit/**/*.test.js`) — no VS Code download
- Do not change rendering behavior except the title-escaping fix
- Plugin behaviors to assert against (verified on this codebase): markdown-it-anchor default config adds `id` attributes to headings (NO permalink anchor element); markdown-it-emoji renders server-side; markdown-it-github-alerts emits `markdown-alert-<type>` classes
- Repo conventions: commit messages without ticket prefix, no Co-Authored-By; never push/publish

---

### Task 1: Render-feature tests + title-escaping fix

**Files:**
- Create: `src/test/unit/render-features.test.ts`
- Modify: `src/render.ts` (`htmlTemplate` — `<title>${title}</title>` near the top of the template, and a new `escapeHtml` helper)

**Interfaces:**
- Consumes: `createMarkdownParser()`, `generateHtml(markdown, title, assets, md)`, `RenderAssets` from `src/render.ts` (existing)
- Produces: nothing consumed by later tasks

- [x] **Step 1: Write the tests**

`src/test/unit/render-features.test.ts`:
```ts
import * as assert from 'assert';
import { createMarkdownParser, generateHtml, RenderAssets } from '../../render';

const ASSETS: RenderAssets = {
  mermaidJs: 'file:///assets/mermaid.min.js',
  hljsJs: 'file:///assets/highlight.min.js',
  hljsCssLight: 'file:///assets/github.min.css',
  hljsCssDark: 'file:///assets/github-dark.min.css',
};

describe('render features', () => {
  const md = createMarkdownParser();
  const render = (markdown: string, title = 't') => generateHtml(markdown, title, ASSETS, md);

  it('renders task lists as checkboxes with checked state', () => {
    const html = render('- [ ] todo\n- [x] done');
    assert.ok(html.includes('task-list-item-checkbox'), 'checkbox input class missing');
    assert.ok(/<input[^>]*checked[^>]*>/.test(html), 'checked item must render checked');
  });

  it('adds anchor ids to headings', () => {
    const html = render('# Hello World');
    assert.ok(/<h1[^>]*id="hello-world"/.test(html));
  });

  it('applies markdown-it-attrs id and class', () => {
    const html = render('# Custom {#my-id .my-class}');
    assert.ok(/<h1[^>]*id="my-id"/.test(html), 'custom id missing');
    assert.ok(/<h1[^>]*class="[^"]*my-class/.test(html), 'custom class missing');
  });

  it('converts emoji shortcodes server-side', () => {
    const html = render('Launch :rocket: now');
    assert.ok(html.includes('🚀'));
  });

  it('renders all five GitHub alert types', () => {
    for (const type of ['note', 'tip', 'important', 'warning', 'caution']) {
      const html = render(`> [!${type.toUpperCase()}]\n> body text`);
      assert.ok(html.includes(`markdown-alert-${type}`), `alert type ${type} missing`);
    }
  });

  it('includes the theme toggle with light/dark/auto buttons', () => {
    const html = render('# hi');
    assert.ok(html.includes('class="theme-toggle"'));
    for (const theme of ['light', 'dark', 'auto']) {
      assert.ok(html.includes(`data-theme="${theme}"`), `theme button ${theme} missing`);
    }
  });

  it('includes the copy-code button script', () => {
    const html = render('# hi');
    assert.ok(html.includes('copy-code-btn'));
  });

  it('linkifies bare URLs', () => {
    const html = render('see https://example.com/docs');
    assert.ok(/<a[^>]*href="https:\/\/example\.com\/docs"/.test(html));
  });

  it('escapes HTML in code fences', () => {
    const html = render('```\n<img src=x onerror=alert(1)>\n```');
    assert.ok(!html.includes('<img src=x'), 'code content must be escaped');
    assert.ok(html.includes('&lt;img'), 'escaped form expected');
  });

  it('keeps mermaid fences unhighlighted for client-side rendering', () => {
    const html = render('```mermaid\nA-->B\n```');
    assert.ok(html.includes('<pre class="mermaid">A--&gt;B'));
  });

  it('escapes the page title', () => {
    const html = render('# hi', '<script>alert(1)</script>');
    assert.ok(!html.includes('<title><script>'), 'raw script tag must not reach <title>');
    assert.ok(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
  });

  it('renders tables', () => {
    const html = render('| a | b |\n|---|---|\n| 1 | 2 |');
    assert.ok(html.includes('<table>'));
  });

  it('renders nothing dangerous for empty input', () => {
    const html = render('');
    assert.ok(html.includes('<!DOCTYPE html>'));
    assert.ok(html.includes('</html>'));
  });
});
```

- [x] **Step 2: Run tests to verify only the title test fails**

Run: `npm run test:unit`
Expected: 24 passing, 1 failing — `escapes the page title` (current template interpolates `${title}` raw). If any OTHER test fails, the assertion doesn't match actual plugin output: run `node -e "const {createMarkdownParser, generateHtml}=require('./out/render'); console.log(generateHtml('<the markdown>','t',{mermaidJs:'m',hljsJs:'h',hljsCssLight:'l',hljsCssDark:'d'},createMarkdownParser()))" | head -80` to inspect real output and adjust the assertion to the actual markup (do not weaken it to a trivial check).

- [x] **Step 3: Fix the title escaping in `src/render.ts`**

Add below the `RenderAssets` interface:
```ts
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
```
In `htmlTemplate`, change `<title>${title}</title>` to `<title>${escapeHtml(title)}</title>`.

- [x] **Step 4: Run tests to verify all pass**

Run: `npm run test:unit`
Expected: 25 passing, 0 failing.

- [x] **Step 5: Commit**

```bash
git add src/test/unit/render-features.test.ts src/render.ts
git commit -m "test: cover render pipeline features; fix unescaped page title"
```

---

### Task 2: Verify the legacy integration suite (HOST ONLY — skip in sandbox)

**Files:**
- Reference: `src/test/runTest.ts`, `src/test/suite/` (3 legacy tests)
- Modify: only if `npm test` fails for fixable reasons (compile paths, API drift)

**Interfaces:**
- Consumes: nothing from Task 1
- Produces: confirmation that `npm test` runs; fixes committed if needed

- [x] **Step 1 (HOST): Run the integration suite**

Run: `npm test`
Expected: downloads VS Code on first run, then 3 tests pass. This step CANNOT run in a network-less sandbox — leave unchecked for the host if sandboxed.

- [x] **Step 2 (HOST): Fix only what blocks the run, then commit if changes were made**

If it fails: typical causes are stale compiled output (`npm run compile` first) or the extension id assertion. Keep fixes minimal — do NOT add new integration tests (out of scope per spec).
```bash
git add -A src/test && git commit -m "test: keep legacy integration suite runnable"
```
(Skip the commit if no changes were needed.)

---

### Task 3: Close out OMD-006

**Files:**
- Modify: `harness/feature_list.json`, `harness/progress.md`, `harness/notes/OMD-006.md`

**Interfaces:**
- Consumes: Tasks 1-2 complete
- Produces: harness memory updated

- [x] **Step 1: Update harness memory**

`harness/feature_list.json`: OMD-006 → `"status": "done"` ONLY if Task 2 host verification also passed; otherwise `in_progress` with a note. `harness/progress.md`: update Current State + Feature index row. `harness/notes/OMD-006.md`: record final test counts and any assertion adjustments made in Task 1 Step 2.

- [x] **Step 2: Commit**

```bash
git add harness/
git commit -m "docs: close out OMD-006 test expansion"
```
