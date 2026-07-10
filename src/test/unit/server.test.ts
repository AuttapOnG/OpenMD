import * as assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as http from 'http';
import { PreviewServer } from '../../server';

function get(url: string): Promise<{ status: number; body: string; headers: http.IncomingHttpHeaders }> {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () => resolve({ status: res.statusCode || 0, body, headers: res.headers }));
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
    fs.mkdirSync(path.join(dir, 'assets', 'katex', 'fonts'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'assets', 'katex', 'katex.min.css'), '/* katex stub */');
    fs.writeFileSync(path.join(dir, 'assets', 'katex', 'fonts', 'KaTeX_Main-Regular.woff2'), 'woff2stub');
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

  it('sends Cache-Control: no-store on rendered pages', async () => {
    const res = await get(`http://127.0.0.1:${port}/proj/a.html`);
    assert.strictEqual(res.headers['cache-control'], 'no-store');
  });

  it('sends Cache-Control: no-store on /mtime responses', async () => {
    const res = await get(`http://127.0.0.1:${port}/mtime?f=${encodeURIComponent('/proj/a.html')}`);
    assert.strictEqual(res.headers['cache-control'], 'no-store');
  });

  it('does not send Cache-Control on static assets', async () => {
    const res = await get(`http://127.0.0.1:${port}/assets/mermaid.min.js`);
    assert.strictEqual(res.headers['cache-control'], undefined);
  });

  it('url() builds a loopback URL', () => {
    assert.strictEqual(server.url('/proj/a.html'), `http://127.0.0.1:${port}/proj/a.html`);
  });

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
});
