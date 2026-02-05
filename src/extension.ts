import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { marked } from 'marked';

// เก็บ reference ของ webview panel
let currentPanel: vscode.WebviewPanel | undefined = undefined;

export function activate(context: vscode.ExtensionContext) {
  
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
        const html = await markdownToHtml(content, fileUri);
        
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
        const html = await markdownToWebviewHtml(content, fileUri, currentPanel);
        currentPanel.webview.html = html;
        
        vscode.window.showInformationMessage('Opening Markdown preview...');
        
      } catch (error) {
        vscode.window.showErrorMessage(`Error: ${error}`);
      }
    }
  );

  context.subscriptions.push(openInBrowser, openInPreview);
}

// สร้าง HTML สำหรับเปิดใน Browser
async function markdownToHtml(
  markdown: string, 
  fileUri: vscode.Uri
): Promise<string> {
  
  const body = await marked(markdown);
  const fileName = path.basename(fileUri.fsPath, '.md');
  
  return getHtmlTemplate(body, fileName);
}

// สร้าง HTML สำหรับ VS Code Webview
async function markdownToWebviewHtml(
  markdown: string,
  fileUri: vscode.Uri,
  panel: vscode.WebviewPanel
): Promise<string> {
  
  const body = await marked(markdown);
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
    <style>
        :root {
            --bg-color: #ffffff;
            --text-color: #24292f;
            --border-color: #d0d7de;
            --code-bg: #f6f8fa;
            --link-color: #0969da;
        }
        
        @media (prefers-color-scheme: dark) {
            :root {
                --bg-color: #0d1117;
                --text-color: #c9d1d9;
                --border-color: #30363d;
                --code-bg: #161b22;
                --link-color: #58a6ff;
            }
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
        
        a {
            color: var(--link-color);
            text-decoration: none;
        }
        a:hover { text-decoration: underline; }
        
        pre {
            background: var(--code-bg);
            padding: 16px;
            border-radius: 6px;
            overflow-x: auto;
            font-size: 85%;
            line-height: 1.45;
        }
        
        code {
            background: var(--code-bg);
            padding: 0.2em 0.4em;
            border-radius: 6px;
            font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
            font-size: 85%;
        }
        
        pre code {
            background: transparent;
            padding: 0;
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
    </style>
</head>
<body>
    ${body}
</body>
</html>`;
}

// Template สำหรับ VS Code Webview (ใช้ CSS ของ VS Code)
function getWebviewTemplate(body: string, title: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            color: var(--vscode-editor-foreground);
            background-color: var(--vscode-editor-background);
            max-width: 900px;
            margin: 0 auto;
            padding: 40px 32px;
            line-height: 1.6;
        }
        
        h1, h2, h3, h4, h5, h6 {
            color: var(--vscode-titleBar-activeForeground);
            margin-top: 24px;
            margin-bottom: 16px;
            font-weight: 600;
            line-height: 1.25;
        }
        
        h1 { 
            border-bottom: 1px solid var(--vscode-panel-border); 
            padding-bottom: 0.3em; 
        }
        h2 { 
            border-bottom: 1px solid var(--vscode-panel-border); 
            padding-bottom: 0.3em; 
        }
        
        a {
            color: var(--vscode-textLink-foreground);
            text-decoration: none;
        }
        a:hover {
            color: var(--vscode-textLink-activeForeground);
            text-decoration: underline;
        }
        
        pre {
            background: var(--vscode-textCodeBlock-background);
            padding: 16px;
            border-radius: 6px;
            overflow-x: auto;
            font-size: 85%;
            line-height: 1.45;
        }
        
        code {
            background: var(--vscode-textCodeBlock-background);
            padding: 0.2em 0.4em;
            border-radius: 6px;
            font-family: var(--vscode-editor-font-family);
            font-size: 85%;
        }
        
        pre code {
            background: transparent;
            padding: 0;
        }
        
        img {
            max-width: 100%;
            height: auto;
            border-radius: 6px;
        }
        
        blockquote {
            border-left: 4px solid var(--vscode-panel-border);
            margin: 0 0 16px 0;
            padding: 0 16px;
            color: var(--vscode-descriptionForeground);
        }
        
        table {
            border-collapse: collapse;
            width: 100%;
            margin-bottom: 16px;
        }
        
        th, td {
            border: 1px solid var(--vscode-panel-border);
            padding: 6px 13px;
            text-align: left;
        }
        
        th {
            background: var(--vscode-textCodeBlock-background);
            font-weight: 600;
        }
        
        tr:nth-child(2n) {
            background: var(--vscode-textCodeBlock-background);
        }
        
        ul, ol {
            padding-left: 2em;
        }
        
        hr {
            border: none;
            border-top: 1px solid var(--vscode-panel-border);
            margin: 24px 0;
        }
    </style>
</head>
<body>
    ${body}
</body>
</html>`;
}

export function deactivate() {}
