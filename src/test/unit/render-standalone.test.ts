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
