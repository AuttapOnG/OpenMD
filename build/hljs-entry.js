// Bundled by esbuild into media/highlight.min.js (IIFE).
// highlight.js's npm package has no single-file browser build, so we make our
// own from lib/common (same ~40 languages as the CDN "common" build).
import hljs from 'highlight.js/lib/common';
window.hljs = hljs;
