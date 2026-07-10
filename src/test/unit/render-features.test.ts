import * as assert from 'assert';
import { createMarkdownParser, generateHtml, RenderAssets } from '../../render';

const ASSETS: RenderAssets = {
  mermaidJs: 'file:///assets/mermaid.min.js',
  hljsJs: 'file:///assets/highlight.min.js',
  hljsCssLight: 'file:///assets/github.min.css',
  hljsCssDark: 'file:///assets/github-dark.min.css',
  katexCss: 'file:///assets/katex/katex.min.css',
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
