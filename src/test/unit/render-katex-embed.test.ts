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
