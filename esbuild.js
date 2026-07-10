const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const markdownItEmojiDefaultPlugin = {
  name: 'markdown-it-emoji-default',
  setup(build) {
    build.onResolve({ filter: /^markdown-it-emoji$/ }, () => ({
      path: 'markdown-it-emoji-default-shim',
      namespace: 'openmd-shims',
    }));
    build.onLoad({ filter: /^markdown-it-emoji-default-shim$/, namespace: 'openmd-shims' }, () => ({
      contents: `export { full as default } from ${JSON.stringify(path.join(__dirname, 'node_modules', 'markdown-it-emoji', 'index.mjs'))};`,
      loader: 'js',
      resolveDir: __dirname,
    }));
  },
};

async function main() {
  fs.mkdirSync('media', { recursive: true });

  // 1. Extension code -> dist/extension.js
  await esbuild.build({
    entryPoints: ['src/extension.ts'],
    bundle: true,
    outfile: 'dist/extension.js',
    platform: 'node',
    format: 'cjs',
    external: ['vscode'],
    minify: true,
    sourcemap: false,
    plugins: [markdownItEmojiDefaultPlugin],
  });

  // 2. hljs browser bundle -> media/highlight.min.js
  await esbuild.build({
    entryPoints: ['build/hljs-entry.js'],
    bundle: true,
    outfile: 'media/highlight.min.js',
    platform: 'browser',
    format: 'iife',
    minify: true,
  });

  // 3. Copy static assets
  const copies = [
    ['node_modules/mermaid/dist/mermaid.min.js', 'media/mermaid.min.js'],
    ['node_modules/highlight.js/styles/github.min.css', 'media/github.min.css'],
    ['node_modules/highlight.js/styles/github-dark.min.css', 'media/github-dark.min.css'],
  ];
  for (const [src, dest] of copies) {
    fs.copyFileSync(src, dest);
  }

  // 3b. KaTeX: css + woff2 fonts only, preserving katex/fonts/ layout so
  // the css's relative url(fonts/...) references resolve everywhere.
  const katexSrc = path.join('node_modules', 'katex', 'dist');
  const katexFontsDest = path.join('media', 'katex', 'fonts');
  fs.mkdirSync(katexFontsDest, { recursive: true });
  fs.copyFileSync(
    path.join(katexSrc, 'katex.min.css'),
    path.join('media', 'katex', 'katex.min.css')
  );
  for (const f of fs.readdirSync(path.join(katexSrc, 'fonts'))) {
    if (f.endsWith('.woff2')) {
      fs.copyFileSync(path.join(katexSrc, 'fonts', f), path.join(katexFontsDest, f));
    }
  }

  for (const f of ['dist/extension.js', 'media/mermaid.min.js', 'media/highlight.min.js', 'media/github.min.css', 'media/github-dark.min.css', path.join('media', 'katex', 'katex.min.css')]) {
    const kb = Math.round(fs.statSync(f).size / 1024);
    console.log(`${f}  ${kb} KB`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
