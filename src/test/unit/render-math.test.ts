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
