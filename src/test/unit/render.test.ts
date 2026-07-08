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
