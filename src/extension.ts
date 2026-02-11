import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import MarkdownIt from 'markdown-it';
import markdownItAttrs from 'markdown-it-attrs';
import markdownItTaskLists from 'markdown-it-task-lists';
import markdownItGithubAlerts from 'markdown-it-github-alerts';
import markdownItAnchor from 'markdown-it-anchor';
import markdownItEmoji from 'markdown-it-emoji';

// เก็บ reference ของ webview panel
let currentPanel: vscode.WebviewPanel | undefined = undefined;

export function activate(context: vscode.ExtensionContext) {
  
  // สร้าง markdown-it instance
  const md = createMarkdownParser();
  
  // Command: Open in Browser
  let openInBrowser = vscode.commands.registerCommand(
    'openmd.openBrowser', 
    async (uri: vscode.Uri) => {
      
      const fileUri = uri || vscode.window.activeTextEditor?.document.uri;
      if (!fileUri) {
        vscode.window.showErrorMessage('No markdown file selected');
        return;
      }

      try {
        const content = fs.readFileSync(fileUri.fsPath, 'utf-8');
        const html = markdownToHtml(content, fileUri, md);
        
        const tempDir = path.join(context.extensionPath, '.temp');
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }
        
        const tempHtmlPath = path.join(tempDir, 'preview.html');
        fs.writeFileSync(tempHtmlPath, html);
        
        const htmlUri = vscode.Uri.file(tempHtmlPath);
        await vscode.env.openExternal(htmlUri);
        
        vscode.window.showInformationMessage('Opening Markdown in browser...');
        
      } catch (error) {
        vscode.window.showErrorMessage(`Error: ${error}`);
      }
    }
  );

  // Command: Open in Preview (VS Code Webview)
  let openInPreview = vscode.commands.registerCommand(
    'openmd.openPreview',
    async (uri: vscode.Uri) => {
      
      const fileUri = uri || vscode.window.activeTextEditor?.document.uri;
      if (!fileUri) {
        vscode.window.showErrorMessage('No markdown file selected');
        return;
      }

      try {
        const content = fs.readFileSync(fileUri.fsPath, 'utf-8');
        const fileName = path.basename(fileUri.fsPath);
        
        // ถ้ามี panel อยู่แล้ว ให้ใช้ panel เดิม
        if (currentPanel) {
          currentPanel.reveal(vscode.ViewColumn.Two);
        } else {
          // สร้าง panel ใหม่
          currentPanel = vscode.window.createWebviewPanel(
            'markdownPreview',
            `Preview: ${fileName}`,
            vscode.ViewColumn.Two,
            {
              enableScripts: true,
              retainContextWhenHidden: true,
              localResourceRoots: [
                vscode.Uri.file(path.dirname(fileUri.fsPath))
              ]
            }
          );

          // ปิด panel แล้วเคลียร์ reference
          currentPanel.onDidDispose(
            () => {
              currentPanel = undefined;
            },
            null,
            context.subscriptions
          );
        }

        // สร้าง HTML สำหรับ webview
        const html = markdownToWebviewHtml(content, fileUri, currentPanel, md);
        currentPanel.webview.html = html;
        
      } catch (error) {
        vscode.window.showErrorMessage(`Error: ${error}`);
      }
    }
  );

  context.subscriptions.push(openInBrowser, openInPreview);
}

// สร้าง markdown-it instance พร้อม plugins
function createMarkdownParser(): MarkdownIt {
  try {
    const md = new MarkdownIt({
      html: true,
      linkify: true,
      typographer: true
    });

    // Configure highlight function - ไม่ใช้ hljs ตรงนี้เพราะ hljs มาจาก CDN
    // ให้ hljs ทำงานเองใน browser หลังจากโหลดเสร็จ
    md.set({
      highlight: (str: string, lang?: string): string => {
        // ถ้าเป็น mermaid ไม่ต้อง highlight ให้ mermaid จัดการเอง
        if (lang === 'mermaid') {
          return `<pre class="mermaid">${md.utils.escapeHtml(str)}</pre>`;
        }
        
        // ไม่ highlight ที่นี่ ให้ hljs ทำเองใน browser
        if (lang) {
          return `<pre class="hljs"><code class="language-${lang}">${md.utils.escapeHtml(str)}</code></pre>`;
        }
        
        return `<pre class="hljs"><code>${md.utils.escapeHtml(str)}</code></pre>`;
      }
    });

    // Add plugins
    try {
      md.use(markdownItAttrs);           // รองรับ attributes {#id .class}
      console.log('✓ markdown-it-attrs loaded');
    } catch (e) { console.error('✗ markdown-it-attrs failed:', e); }
    
    try {
      md.use(markdownItTaskLists);       // Task lists - [x] 
      console.log('✓ markdown-it-task-lists loaded');
    } catch (e) { console.error('✗ markdown-it-task-lists failed:', e); }
    
    try {
      md.use(markdownItGithubAlerts);    // GitHub Alerts [!NOTE] [!WARNING]
      console.log('✓ markdown-it-github-alerts loaded');
    } catch (e) { console.error('✗ markdown-it-github-alerts failed:', e); }
    
    try {
      md.use(markdownItAnchor);          // Anchor links สำหรับ headings
      console.log('✓ markdown-it-anchor loaded');
    } catch (e) { console.error('✗ markdown-it-anchor failed:', e); }
    
    try {
      md.use(markdownItEmoji);           // Emoji shortcodes :smile:
      console.log('✓ markdown-it-emoji loaded');
    } catch (e) { console.error('✗ markdown-it-emoji failed:', e); }

    return md;
  } catch (error) {
    console.error('Failed to create markdown parser:', error);
    // Fallback to basic markdown-it
    return new MarkdownIt({ html: true });
  }
}

// สร้าง HTML สำหรับเปิดใน Browser
function markdownToHtml(
  markdown: string, 
  fileUri: vscode.Uri,
  md: MarkdownIt
): string {
  
  const body = md.render(markdown);
  const fileName = path.basename(fileUri.fsPath, '.md');
  
  return getHtmlTemplate(body, fileName);
}

// สร้าง HTML สำหรับ VS Code Webview
function markdownToWebviewHtml(
  markdown: string,
  fileUri: vscode.Uri,
  panel: vscode.WebviewPanel,
  md: MarkdownIt
): string {
  
  const body = md.render(markdown);
  const fileName = path.basename(fileUri.fsPath, '.md');
  
  return getWebviewTemplate(body, fileName);
}

// Template สำหรับ Browser
function getHtmlTemplate(body: string, title: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    
    <!-- Syntax Highlighting -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css" media="(prefers-color-scheme: light)">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css" media="(prefers-color-scheme: dark)">
    
    <!-- Mermaid -->
    <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
    
    <style>
        :root {
            --bg-color: #ffffff;
            --text-color: #24292f;
            --border-color: #d0d7de;
            --code-bg: #f6f8fa;
            --link-color: #0969da;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif;
            max-width: 900px;
            margin: 0 auto;
            padding: 45px 32px;
            line-height: 1.6;
            color: var(--text-color);
            background-color: var(--bg-color);
        }
        
        h1, h2, h3, h4, h5, h6 {
            margin-top: 24px;
            margin-bottom: 16px;
            font-weight: 600;
            line-height: 1.25;
        }
        
        h1 { border-bottom: 1px solid var(--border-color); padding-bottom: 0.3em; }
        h2 { border-bottom: 1px solid var(--border-color); padding-bottom: 0.3em; }
        
        /* Anchor link for headings */
        h1:hover .header-anchor,
        h2:hover .header-anchor,
        h3:hover .header-anchor,
        h4:hover .header-anchor,
        h5:hover .header-anchor,
        h6:hover .header-anchor {
            opacity: 1;
        }
        
        .header-anchor {
            float: left;
            margin-left: -20px;
            padding-right: 4px;
            text-decoration: none;
            opacity: 0;
            transition: opacity 0.2s;
        }
        
        a {
            color: var(--link-color);
            text-decoration: none;
        }
        a:hover { text-decoration: underline; }
        
        /* Syntax Highlighting */
        pre {
            background: var(--code-bg);
            padding: 16px;
            border-radius: 6px;
            overflow-x: auto;
            font-size: 85%;
            line-height: 1.45;
            position: relative;
        }
        
        pre.hljs {
            background: var(--code-bg);
        }
        
        code {
            background: var(--code-bg);
            color: var(--text-color);
            padding: 0.2em 0.4em;
            border-radius: 6px;
            font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
            font-size: 85%;
        }
        
        pre code {
            background: transparent;
            padding: 0;
        }
        
        /* Copy Code Button */
        .copy-code-btn {
            position: absolute;
            top: 8px;
            right: 8px;
            background: var(--bg-color);
            border: 1px solid var(--border-color);
            border-radius: 6px;
            padding: 4px 8px;
            font-size: 12px;
            cursor: pointer;
            opacity: 0;
            transition: opacity 0.2s;
        }
        
        pre:hover .copy-code-btn {
            opacity: 1;
        }
        
        .copy-code-btn:hover {
            background: var(--code-bg);
        }
        
        .copy-code-btn.copied {
            color: #1a7f37;
        }
        
        /* Mermaid */
        .mermaid {
            background: transparent !important;
            text-align: center;
        }
        
        /* Task Lists */
        .task-list-item {
            list-style-type: none;
        }
        
        .task-list-item input[type="checkbox"] {
            margin-right: 0.5em;
            cursor: pointer;
        }
        
        /* GitHub Alerts */
        .markdown-alert {
            padding: 16px;
            margin-bottom: 16px;
            border-left: 4px solid var(--border-color);
            border-radius: 6px;
            background: var(--code-bg);
        }
        
        .markdown-alert-note {
            border-left-color: #0969da;
            background: rgba(9, 105, 218, 0.1);
        }
        
        .markdown-alert-tip {
            border-left-color: #1a7f37;
            background: rgba(26, 127, 55, 0.1);
        }
        
        .markdown-alert-important {
            border-left-color: #8250df;
            background: rgba(130, 80, 223, 0.1);
        }
        
        .markdown-alert-warning {
            border-left-color: #9a6700;
            background: rgba(154, 103, 0, 0.1);
        }
        
        .markdown-alert-caution {
            border-left-color: #cf222e;
            background: rgba(207, 34, 46, 0.1);
        }
        
        .markdown-alert-title {
            display: flex;
            align-items: center;
            font-weight: 600;
            margin-bottom: 8px;
            color: var(--text-color);
        }
        
        .markdown-alert-title::before {
            margin-right: 8px;
            font-size: 16px;
        }
        
        .markdown-alert-note .markdown-alert-title::before {
            content: "ℹ️";
        }
        
        .markdown-alert-tip .markdown-alert-title::before {
            content: "💡";
        }
        
        .markdown-alert-important .markdown-alert-title::before {
            content: "🔔";
        }
        
        .markdown-alert-warning .markdown-alert-title::before {
            content: "⚠️";
        }
        
        .markdown-alert-caution .markdown-alert-title::before {
            content: "🛑";
        }
        
        /* Table of Contents */
        .table-of-contents {
            background: var(--code-bg);
            border: 1px solid var(--border-color);
            border-radius: 6px;
            padding: 16px;
            margin-bottom: 16px;
        }
        
        .table-of-contents summary {
            font-weight: 600;
            cursor: pointer;
        }
        
        .table-of-contents ul {
            margin: 8px 0 0 0;
            padding-left: 20px;
        }
        
        img {
            max-width: 100%;
            height: auto;
            border-radius: 6px;
        }
        
        blockquote {
            border-left: 4px solid var(--border-color);
            margin: 0 0 16px 0;
            padding: 0 16px;
            color: #656d76;
        }
        
        table {
            border-collapse: collapse;
            width: 100%;
            margin-bottom: 16px;
        }
        
        th, td {
            border: 1px solid var(--border-color);
            padding: 6px 13px;
            text-align: left;
        }
        
        th {
            background: var(--code-bg);
            font-weight: 600;
        }
        
        tr:nth-child(2n) {
            background: var(--code-bg);
        }
        
        ul, ol {
            padding-left: 2em;
        }
        
        hr {
            border: none;
            border-top: 1px solid var(--border-color);
            margin: 24px 0;
        }
        
        /* Dark Mode Toggle */
        .theme-toggle {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: var(--bg-color);
            border: 1px solid var(--border-color);
            border-radius: 50px;
            padding: 8px;
            display: flex;
            gap: 4px;
            box-shadow: 0 2px 12px rgba(0,0,0,0.15);
            z-index: 1000;
        }
        
        .theme-btn {
            background: transparent;
            border: none;
            border-radius: 50%;
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            font-size: 16px;
            transition: all 0.2s ease;
            color: var(--text-color);
        }
        
        .theme-btn:hover {
            background: var(--code-bg);
        }
        
        .theme-btn.active {
            background: var(--link-color);
            color: white;
        }
        
        /* Manual dark mode override */
        [data-theme="dark"] {
            --bg-color: #0d1117;
            --text-color: #c9d1d9;
            --border-color: #30363d;
            --code-bg: #161b22;
            --link-color: #58a6ff;
        }
        
        [data-theme="light"] {
            --bg-color: #ffffff;
            --text-color: #24292f;
            --border-color: #d0d7de;
            --code-bg: #f6f8fa;
            --link-color: #0969da;
        }
        
        /* Auto mode - use system preference */
        @media (prefers-color-scheme: dark) {
            :root:not([data-theme="light"]) {
                --bg-color: #0d1117;
                --text-color: #c9d1d9;
                --border-color: #30363d;
                --code-bg: #161b22;
                --link-color: #58a6ff;
            }
        }
    </style>
</head>
<body>
    ${body}
    
    <!-- Dark Mode Toggle -->
    <div class="theme-toggle" title="Toggle theme">
        <button class="theme-btn" data-theme="light" title="Light">☀️</button>
        <button class="theme-btn" data-theme="dark" title="Dark">🌙</button>
        <button class="theme-btn" data-theme="auto" title="Auto">💻</button>
    </div>
    
    <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
    <script>
        // Initialize Mermaid
        mermaid.initialize({
            startOnLoad: false,
            theme: 'default',
            securityLevel: 'loose'
        });
        
        // Wait for window load (all resources including mermaid CDN)
        window.addEventListener('load', function() {
            console.log('Window loaded, initializing...');
            
            // Initialize Mermaid
            try {
                mermaid.run();
                console.log('Mermaid initialized successfully');
            } catch (e) {
                console.error('Mermaid error:', e);
            }
            
            // Initialize Highlight.js for all code blocks
            if (typeof hljs !== 'undefined') {
                hljs.highlightAll();
            } else {
                console.error('hljs not loaded yet');
            }
            
            // Convert emoji shortcodes
            convertEmojis();
        });
        
        // Convert emoji shortcodes to actual emoji
        function convertEmojis() {
            const emojiMap = {
                ':wave:': '👋',
                ':rocket:': '🚀',
                ':fire:': '🔥',
                ':sparkles:': '✨',
                ':smile:': '😊',
                ':heart:': '❤️',
                ':thumbsup:': '👍',
                ':star:': '⭐',
                ':warning:': '⚠️',
                ':bulb:': '💡',
                ':bell:': '🔔',
                ':stop_sign:': '🛑',
                ':information_source:': 'ℹ️',
                ':white_check_mark:': '✅',
                ':x:': '❌',
                ':tada:': '🎉',
                ':zap:': '⚡',
                ':sun:': '☀️',
                ':moon:': '🌙',
                ':computer:': '💻'
            };
            
            const walker = document.createTreeWalker(
                document.body,
                NodeFilter.SHOW_TEXT,
                null,
                false
            );
            
            const textNodes = [];
            let node;
            while (node = walker.nextNode()) {
                if (node.parentElement && !['SCRIPT', 'STYLE', 'CODE', 'PRE'].includes(node.parentElement.tagName)) {
                    textNodes.push(node);
                }
            }
            
            textNodes.forEach(node => {
                let text = node.textContent;
                let hasChanged = false;
                
                for (const [shortcode, emoji] of Object.entries(emojiMap)) {
                    if (text.includes(shortcode)) {
                        text = text.split(shortcode).join(emoji);
                        hasChanged = true;
                    }
                }
                
                if (hasChanged) {
                    node.textContent = text;
                }
            });
            
            console.log('Emoji conversion completed');
        }
        
        // Copy Code Button
        document.querySelectorAll('pre').forEach(pre => {
            const code = pre.querySelector('code');
            if (!code || pre.classList.contains('mermaid')) return;
            
            const btn = document.createElement('button');
            btn.className = 'copy-code-btn';
            btn.textContent = 'Copy';
            btn.addEventListener('click', () => {
                const text = code.textContent || '';
                navigator.clipboard.writeText(text).then(() => {
                    btn.textContent = 'Copied!';
                    btn.classList.add('copied');
                    setTimeout(() => {
                        btn.textContent = 'Copy';
                        btn.classList.remove('copied');
                    }, 2000);
                });
            });
            pre.appendChild(btn);
        });
        
        // Dark Mode Toggle
        (function() {
            const themeBtns = document.querySelectorAll('.theme-btn');
            const html = document.documentElement;
            
            // Load saved theme
            const savedTheme = localStorage.getItem('openmd-theme') || 'auto';
            setTheme(savedTheme);
            
            // Button click handlers
            themeBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    const theme = btn.dataset.theme;
                    setTheme(theme);
                    localStorage.setItem('openmd-theme', theme);
                });
            });
            
            function setTheme(theme) {
                // Update data-theme attribute
                if (theme === 'auto') {
                    html.removeAttribute('data-theme');
                } else {
                    html.setAttribute('data-theme', theme);
                }
                
                // Update active button
                themeBtns.forEach(btn => {
                    btn.classList.toggle('active', btn.dataset.theme === theme);
                });
            }
        })();
    </script>
</body>
</html>`;
}

// Template สำหรับ VS Code Webview
function getWebviewTemplate(body: string, title: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    
    <!-- Syntax Highlighting -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css" media="(prefers-color-scheme: light)">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css" media="(prefers-color-scheme: dark)">
    
    <!-- Mermaid -->
    <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
    
    <style>
        :root {
            --bg-color: #ffffff;
            --text-color: #24292f;
            --border-color: #d0d7de;
            --code-bg: #f6f8fa;
            --link-color: #0969da;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif;
            max-width: 900px;
            margin: 0 auto;
            padding: 45px 32px;
            line-height: 1.6;
            color: var(--text-color);
            background-color: var(--bg-color);
        }
        
        h1, h2, h3, h4, h5, h6 {
            margin-top: 24px;
            margin-bottom: 16px;
            font-weight: 600;
            line-height: 1.25;
        }
        
        h1 { border-bottom: 1px solid var(--border-color); padding-bottom: 0.3em; }
        h2 { border-bottom: 1px solid var(--border-color); padding-bottom: 0.3em; }
        
        /* Anchor link for headings */
        h1:hover .header-anchor,
        h2:hover .header-anchor,
        h3:hover .header-anchor,
        h4:hover .header-anchor,
        h5:hover .header-anchor,
        h6:hover .header-anchor {
            opacity: 1;
        }
        
        .header-anchor {
            float: left;
            margin-left: -20px;
            padding-right: 4px;
            text-decoration: none;
            opacity: 0;
            transition: opacity 0.2s;
        }
        
        a {
            color: var(--link-color);
            text-decoration: none;
        }
        a:hover { text-decoration: underline; }
        
        /* Syntax Highlighting */
        pre {
            background: var(--code-bg);
            padding: 16px;
            border-radius: 6px;
            overflow-x: auto;
            font-size: 85%;
            line-height: 1.45;
            position: relative;
        }
        
        pre.hljs {
            background: var(--code-bg);
        }
        
        code {
            background: var(--code-bg);
            color: var(--text-color);
            padding: 0.2em 0.4em;
            border-radius: 6px;
            font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
            font-size: 85%;
        }
        
        pre code {
            background: transparent;
            padding: 0;
        }
        
        /* Copy Code Button */
        .copy-code-btn {
            position: absolute;
            top: 8px;
            right: 8px;
            background: var(--bg-color);
            border: 1px solid var(--border-color);
            border-radius: 6px;
            padding: 4px 8px;
            font-size: 12px;
            cursor: pointer;
            opacity: 0;
            transition: opacity 0.2s;
        }
        
        pre:hover .copy-code-btn {
            opacity: 1;
        }
        
        .copy-code-btn:hover {
            background: var(--code-bg);
        }
        
        .copy-code-btn.copied {
            color: #1a7f37;
        }
        
        /* Mermaid */
        .mermaid {
            background: transparent !important;
            text-align: center;
        }
        
        /* Task Lists */
        .task-list-item {
            list-style-type: none;
        }
        
        .task-list-item input[type="checkbox"] {
            margin-right: 0.5em;
            cursor: pointer;
        }
        
        /* GitHub Alerts */
        .markdown-alert {
            padding: 16px;
            margin-bottom: 16px;
            border-left: 4px solid var(--border-color);
            border-radius: 6px;
            background: var(--code-bg);
        }
        
        .markdown-alert-note {
            border-left-color: #0969da;
            background: rgba(9, 105, 218, 0.1);
        }
        
        .markdown-alert-tip {
            border-left-color: #1a7f37;
            background: rgba(26, 127, 55, 0.1);
        }
        
        .markdown-alert-important {
            border-left-color: #8250df;
            background: rgba(130, 80, 223, 0.1);
        }
        
        .markdown-alert-warning {
            border-left-color: #9a6700;
            background: rgba(154, 103, 0, 0.1);
        }
        
        .markdown-alert-caution {
            border-left-color: #cf222e;
            background: rgba(207, 34, 46, 0.1);
        }
        
        .markdown-alert-title {
            display: flex;
            align-items: center;
            font-weight: 600;
            margin-bottom: 8px;
            color: var(--text-color);
        }
        
        .markdown-alert-title::before {
            margin-right: 8px;
            font-size: 16px;
        }
        
        .markdown-alert-note .markdown-alert-title::before {
            content: "ℹ️";
        }
        
        .markdown-alert-tip .markdown-alert-title::before {
            content: "💡";
        }
        
        .markdown-alert-important .markdown-alert-title::before {
            content: "🔔";
        }
        
        .markdown-alert-warning .markdown-alert-title::before {
            content: "⚠️";
        }
        
        .markdown-alert-caution .markdown-alert-title::before {
            content: "🛑";
        }
        
        /* Table of Contents */
        .table-of-contents {
            background: var(--code-bg);
            border: 1px solid var(--border-color);
            border-radius: 6px;
            padding: 16px;
            margin-bottom: 16px;
        }
        
        .table-of-contents summary {
            font-weight: 600;
            cursor: pointer;
        }
        
        .table-of-contents ul {
            margin: 8px 0 0 0;
            padding-left: 20px;
        }
        
        img {
            max-width: 100%;
            height: auto;
            border-radius: 6px;
        }
        
        blockquote {
            border-left: 4px solid var(--border-color);
            margin: 0 0 16px 0;
            padding: 0 16px;
            color: #656d76;
        }
        
        table {
            border-collapse: collapse;
            width: 100%;
            margin-bottom: 16px;
        }
        
        th, td {
            border: 1px solid var(--border-color);
            padding: 6px 13px;
            text-align: left;
        }
        
        th {
            background: var(--code-bg);
            font-weight: 600;
        }
        
        tr:nth-child(2n) {
            background: var(--code-bg);
        }
        
        ul, ol {
            padding-left: 2em;
        }
        
        hr {
            border: none;
            border-top: 1px solid var(--border-color);
            margin: 24px 0;
        }
        
        /* Dark Mode Toggle */
        .theme-toggle {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: var(--bg-color);
            border: 1px solid var(--border-color);
            border-radius: 50px;
            padding: 8px;
            display: flex;
            gap: 4px;
            box-shadow: 0 2px 12px rgba(0,0,0,0.15);
            z-index: 1000;
        }
        
        .theme-btn {
            background: transparent;
            border: none;
            border-radius: 50%;
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            font-size: 16px;
            transition: all 0.2s ease;
            color: var(--text-color);
        }
        
        .theme-btn:hover {
            background: var(--code-bg);
        }
        
        .theme-btn.active {
            background: var(--link-color);
            color: white;
        }
        
        /* Manual dark mode override */
        [data-theme="dark"] {
            --bg-color: #0d1117;
            --text-color: #c9d1d9;
            --border-color: #30363d;
            --code-bg: #161b22;
            --link-color: #58a6ff;
        }
        
        [data-theme="light"] {
            --bg-color: #ffffff;
            --text-color: #24292f;
            --border-color: #d0d7de;
            --code-bg: #f6f8fa;
            --link-color: #0969da;
        }
        
        /* Auto mode - use system preference */
        @media (prefers-color-scheme: dark) {
            :root:not([data-theme="light"]) {
                --bg-color: #0d1117;
                --text-color: #c9d1d9;
                --border-color: #30363d;
                --code-bg: #161b22;
                --link-color: #58a6ff;
            }
        }
    </style>
</head>
<body>
    ${body}
    
    <!-- Dark Mode Toggle -->
    <div class="theme-toggle" title="Toggle theme">
        <button class="theme-btn" data-theme="light" title="Light">☀️</button>
        <button class="theme-btn" data-theme="dark" title="Dark">🌙</button>
        <button class="theme-btn" data-theme="auto" title="Auto">💻</button>
    </div>
    
    <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
    <script>
        // Initialize Mermaid
        mermaid.initialize({
            startOnLoad: false,
            theme: 'default',
            securityLevel: 'loose'
        });
        
        // Wait for window load (all resources including mermaid CDN)
        window.addEventListener('load', function() {
            console.log('Window loaded, initializing...');
            
            // Initialize Mermaid
            try {
                mermaid.run();
                console.log('Mermaid initialized successfully');
            } catch (e) {
                console.error('Mermaid error:', e);
            }
            
            // Initialize Highlight.js for all code blocks
            if (typeof hljs !== 'undefined') {
                hljs.highlightAll();
            } else {
                console.error('hljs not loaded yet');
            }
            
            // Convert emoji shortcodes
            convertEmojis();
        });
        
        // Convert emoji shortcodes to actual emoji
        function convertEmojis() {
            const emojiMap = {
                ':wave:': '👋',
                ':rocket:': '🚀',
                ':fire:': '🔥',
                ':sparkles:': '✨',
                ':smile:': '😊',
                ':heart:': '❤️',
                ':thumbsup:': '👍',
                ':star:': '⭐',
                ':warning:': '⚠️',
                ':bulb:': '💡',
                ':bell:': '🔔',
                ':stop_sign:': '🛑',
                ':information_source:': 'ℹ️',
                ':white_check_mark:': '✅',
                ':x:': '❌',
                ':tada:': '🎉',
                ':zap:': '⚡',
                ':sun:': '☀️',
                ':moon:': '🌙',
                ':computer:': '💻'
            };
            
            const walker = document.createTreeWalker(
                document.body,
                NodeFilter.SHOW_TEXT,
                null,
                false
            );
            
            const textNodes = [];
            let node;
            while (node = walker.nextNode()) {
                if (node.parentElement && !['SCRIPT', 'STYLE', 'CODE', 'PRE'].includes(node.parentElement.tagName)) {
                    textNodes.push(node);
                }
            }
            
            textNodes.forEach(node => {
                let text = node.textContent;
                let hasChanged = false;
                
                for (const [shortcode, emoji] of Object.entries(emojiMap)) {
                    if (text.includes(shortcode)) {
                        text = text.split(shortcode).join(emoji);
                        hasChanged = true;
                    }
                }
                
                if (hasChanged) {
                    node.textContent = text;
                }
            });
            
            console.log('Emoji conversion completed');
        }
        
        // Copy Code Button
        document.querySelectorAll('pre').forEach(pre => {
            const code = pre.querySelector('code');
            if (!code || pre.classList.contains('mermaid')) return;
            
            const btn = document.createElement('button');
            btn.className = 'copy-code-btn';
            btn.textContent = 'Copy';
            btn.addEventListener('click', () => {
                const text = code.textContent || '';
                navigator.clipboard.writeText(text).then(() => {
                    btn.textContent = 'Copied!';
                    btn.classList.add('copied');
                    setTimeout(() => {
                        btn.textContent = 'Copy';
                        btn.classList.remove('copied');
                    }, 2000);
                });
            });
            pre.appendChild(btn);
        });
        
        // Dark Mode Toggle
        (function() {
            const themeBtns = document.querySelectorAll('.theme-btn');
            const html = document.documentElement;
            
            // Load saved theme
            const savedTheme = localStorage.getItem('openmd-theme') || 'auto';
            setTheme(savedTheme);
            
            // Button click handlers
            themeBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    const theme = btn.dataset.theme;
                    setTheme(theme);
                    localStorage.setItem('openmd-theme', theme);
                });
            });
            
            function setTheme(theme) {
                // Update data-theme attribute
                if (theme === 'auto') {
                    html.removeAttribute('data-theme');
                } else {
                    html.setAttribute('data-theme', theme);
                }
                
                // Update active button
                themeBtns.forEach(btn => {
                    btn.classList.toggle('active', btn.dataset.theme === theme);
                });
            }
        })();
    </script>
</body>
</html>`;
}

export function deactivate() {}
