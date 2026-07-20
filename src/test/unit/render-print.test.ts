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
