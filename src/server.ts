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
        res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
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
        if (!fs.existsSync(filePath)) {
          res.writeHead(404).end();
          return;
        }
        res.writeHead(200, { 'Content-Type': CONTENT_TYPES[path.extname(name)] || 'application/octet-stream' });
        fs.createReadStream(filePath).pipe(res);
        return;
      }
      const source = this.pages.get(pathname);
      if (!source || !fs.existsSync(source)) {
        res.writeHead(404).end();
        return;
      }
      res.writeHead(200, { 'Content-Type': CONTENT_TYPES['.html'], 'Cache-Control': 'no-store' });
      res.end(this.opts.renderFile(source, pathname));
    } catch (err) {
      res.writeHead(500).end(String(err));
    }
  }
}
