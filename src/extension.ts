import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { createMarkdownParser, generateHtml, generateStandaloneHtml, embedKatexFonts, RenderAssets, InlineAssets } from './render';
import { PreviewServer } from './server';
import { computeMirrorHtmlPath, toUrlPath, deriveExtensionId, isOwnVersionedDir } from './paths';

// เก็บ reference ของ webview panel
let currentPanel: vscode.WebviewPanel | undefined = undefined;
let currentPreviewSource: vscode.Uri | undefined = undefined;

// Mirror path ของไฟล์ (เช่น /Users/x/Project/OpenMD/README.md → Project/OpenMD/README.html)
function mirrorHtmlPathFor(fileUri: vscode.Uri): string {
  return computeMirrorHtmlPath({
    filePath: fileUri.fsPath,
    workspacePath: vscode.workspace.getWorkspaceFolder(fileUri)?.uri.fsPath,
    homeDir: process.env.HOME || process.env.USERPROFILE || '',
  });
}

export function activate(context: vscode.ExtensionContext) {
  
  // Cleanup temp files ทุก version ตอน activate
  const extensionsDir = path.dirname(context.extensionPath);
  const extensionId = deriveExtensionId(path.basename(context.extensionPath)); // เอาชื่อ extension ไม่รวม version
  
  try {
    if (fs.existsSync(extensionsDir)) {
      const entries = fs.readdirSync(extensionsDir);
      
      for (const entry of entries) {
        // หาโฟลเดอร์ที่เป็นชื่อ extension เรา (ทุก version)
        if (isOwnVersionedDir(entry, extensionId)) {
          const otherTempDir = path.join(extensionsDir, entry, '.temp');
          if (fs.existsSync(otherTempDir)) {
            try {
              fs.rmSync(otherTempDir, { recursive: true, force: true });
              console.log(`[OpenMD] Cleaned up temp: ${entry}`);
            } catch (err) {
              console.error(`[OpenMD] Failed to cleanup ${entry}:`, err);
            }
          }
        }
      }
    }
  } catch (err) {
    console.error('[OpenMD] Error scanning extensions:', err);
  }

  // Stage offline assets — MUST run after cleanup, which deletes .temp for every version.
  const assetsDir = path.join(context.extensionPath, '.temp', 'assets');
  const ASSET_FILES = ['mermaid.min.js', 'highlight.min.js', 'github.min.css', 'github-dark.min.css'];
  try {
    fs.mkdirSync(assetsDir, { recursive: true });
    for (const f of ASSET_FILES) {
      fs.copyFileSync(path.join(context.extensionPath, 'media', f), path.join(assetsDir, f));
    }
    // katex needs its directory layout preserved (css references fonts/ relatively)
    fs.cpSync(
      path.join(context.extensionPath, 'media', 'katex'),
      path.join(assetsDir, 'katex'),
      { recursive: true }
    );
  } catch (err) {
    console.error('[OpenMD] Failed to stage assets:', err);
  }

  const browserAssets: RenderAssets = {
    mermaidJs: vscode.Uri.file(path.join(assetsDir, 'mermaid.min.js')).toString(),
    hljsJs: vscode.Uri.file(path.join(assetsDir, 'highlight.min.js')).toString(),
    hljsCssLight: vscode.Uri.file(path.join(assetsDir, 'github.min.css')).toString(),
    hljsCssDark: vscode.Uri.file(path.join(assetsDir, 'github-dark.min.css')).toString(),
    katexCss: vscode.Uri.file(path.join(assetsDir, 'katex', 'katex.min.css')).toString(),
  };

  // Assets referenced by pages served over http:// (file:// subresources are blocked there)
  const servedAssets: RenderAssets = {
    mermaidJs: '/assets/mermaid.min.js',
    hljsJs: '/assets/highlight.min.js',
    hljsCssLight: '/assets/github.min.css',
    hljsCssDark: '/assets/github-dark.min.css',
    katexCss: '/assets/katex/katex.min.css',
  };
  
  // สร้าง markdown-it instance
  const md = createMarkdownParser();

  const mediaPath = (...p: string[]) => path.join(context.extensionPath, 'media', ...p);
  function buildInlineAssets(): InlineAssets {
    const katexCss = embedKatexFonts(
      fs.readFileSync(mediaPath('katex', 'katex.min.css'), 'utf-8'),
      (file) => {
        try { return fs.readFileSync(mediaPath('katex', 'fonts', file)); }
        catch { return null; }
      }
    );
    return {
      hljsJs: fs.readFileSync(mediaPath('highlight.min.js'), 'utf-8'),
      hljsCssLight: fs.readFileSync(mediaPath('github.min.css'), 'utf-8'),
      hljsCssDark: fs.readFileSync(mediaPath('github-dark.min.css'), 'utf-8'),
      mermaidJs: fs.readFileSync(mediaPath('mermaid.min.js'), 'utf-8'),
      katexCss,
    };
  }

  let previewServer: PreviewServer | undefined;
  async function ensureServer(): Promise<PreviewServer | undefined> {
    if (previewServer) {
      return previewServer;
    }
    const server = new PreviewServer({
      assetsDir,
      renderFile: (sourcePath, urlPath) =>
        generateHtml(
          fs.readFileSync(sourcePath, 'utf-8'),
          path.basename(sourcePath, '.md'),
          servedAssets,
          md,
          { mtimeUrl: `/mtime?f=${encodeURIComponent(urlPath)}` }
        ),
    });
    try {
      await server.start();
      previewServer = server;
      context.subscriptions.push({ dispose: () => server.stop() });
      return previewServer;
    } catch (err) {
      console.error('[OpenMD] Preview server failed to start:', err);
      return undefined;
    }
  }

  function renderPreviewPanel(fileUri: vscode.Uri): void {
    if (!currentPanel) {
      return;
    }
    const mediaUri = (f: string) =>
      currentPanel!.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'media', f)).toString();
    const webviewAssets: RenderAssets = {
      mermaidJs: mediaUri('mermaid.min.js'),
      hljsJs: mediaUri('highlight.min.js'),
      hljsCssLight: mediaUri('github.min.css'),
      hljsCssDark: mediaUri('github-dark.min.css'),
      katexCss: mediaUri('katex/katex.min.css'),
    };
    const content = fs.readFileSync(fileUri.fsPath, 'utf-8');
    currentPanel.webview.html = generateHtml(content, path.basename(fileUri.fsPath, '.md'), webviewAssets, md);
  }
  
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
        const server = await ensureServer();
        if (server) {
          const urlPath = '/' + toUrlPath(mirrorHtmlPathFor(fileUri));
          server.register(urlPath, fileUri.fsPath);
          await vscode.env.openExternal(vscode.Uri.parse(server.url(urlPath)));
          return;
        }

        // Fallback: static temp file (v1.0.0 behavior, no auto-refresh)
        vscode.window.showWarningMessage('OpenMD: live preview server unavailable — opening static preview instead.');
        const content = fs.readFileSync(fileUri.fsPath, 'utf-8');
        const html = generateHtml(content, path.basename(fileUri.fsPath, '.md'), browserAssets, md);
        const tempHtmlPath = path.join(context.extensionPath, '.temp', mirrorHtmlPathFor(fileUri));
        fs.mkdirSync(path.dirname(tempHtmlPath), { recursive: true });
        fs.writeFileSync(tempHtmlPath, html);
        await vscode.env.openExternal(vscode.Uri.file(tempHtmlPath));
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
                vscode.Uri.file(path.dirname(fileUri.fsPath)),
                vscode.Uri.joinPath(context.extensionUri, 'media')
              ]
            }
          );

          // ปิด panel แล้วเคลียร์ reference
          currentPanel.onDidDispose(
            () => {
              currentPanel = undefined;
              currentPreviewSource = undefined;
            },
            null,
            context.subscriptions
          );
        }

        currentPreviewSource = fileUri;
        renderPreviewPanel(fileUri);
        
      } catch (error) {
        vscode.window.showErrorMessage(`Error: ${error}`);
      }
    }
  );

  const onSave = vscode.workspace.onDidSaveTextDocument((doc) => {
    if (currentPanel && currentPreviewSource && doc.uri.fsPath === currentPreviewSource.fsPath) {
      renderPreviewPanel(currentPreviewSource);
    }
  });
  context.subscriptions.push(onSave);

  // Command: Export to HTML (self-contained single file, next to the source)
  let exportHtml = vscode.commands.registerCommand(
    'openmd.exportHtml',
    async (uri: vscode.Uri) => {
      const fileUri = uri || vscode.window.activeTextEditor?.document.uri;
      if (!fileUri) {
        vscode.window.showErrorMessage('No markdown file selected');
        return;
      }
      try {
        const content = fs.readFileSync(fileUri.fsPath, 'utf-8');
        const html = generateStandaloneHtml(
          content,
          path.basename(fileUri.fsPath, '.md'),
          buildInlineAssets(),
          md
        );
        const outPath = fileUri.fsPath.replace(/\.md$/i, '.html');
        fs.writeFileSync(outPath, html);

        const OPEN = 'Open', REVEAL = 'Reveal';
        const choice = await vscode.window.showInformationMessage(
          `OpenMD: exported ${path.basename(outPath)}`, OPEN, REVEAL
        );
        if (choice === OPEN) {
          await vscode.env.openExternal(vscode.Uri.file(outPath));
        } else if (choice === REVEAL) {
          await vscode.commands.executeCommand('revealFileInOS', vscode.Uri.file(outPath));
        }
      } catch (error) {
        vscode.window.showErrorMessage(`OpenMD export failed: ${error}`);
      }
    }
  );

  // Command: Export to PDF (open in the browser + auto-print → Save as PDF)
  let exportPdf = vscode.commands.registerCommand(
    'openmd.exportPdf',
    async (uri: vscode.Uri) => {
      const fileUri = uri || vscode.window.activeTextEditor?.document.uri;
      if (!fileUri) {
        vscode.window.showErrorMessage('No markdown file selected');
        return;
      }
      try {
        const server = await ensureServer();
        if (server) {
          const urlPath = '/' + toUrlPath(mirrorHtmlPathFor(fileUri));
          server.register(urlPath, fileUri.fsPath);
          await vscode.env.openExternal(vscode.Uri.parse(server.url(urlPath) + '?print=1'));
          vscode.window.showInformationMessage('OpenMD: opening print dialog — choose "Save as PDF".');
          return;
        }
        // Fallback: no server — export a standalone file and open it (print manually).
        const content = fs.readFileSync(fileUri.fsPath, 'utf-8');
        const html = generateStandaloneHtml(content, path.basename(fileUri.fsPath, '.md'), buildInlineAssets(), md);
        const outPath = fileUri.fsPath.replace(/\.md$/i, '.html');
        fs.writeFileSync(outPath, html);
        await vscode.env.openExternal(vscode.Uri.file(outPath));
        vscode.window.showWarningMessage('OpenMD: live server unavailable — opened the HTML; press Ctrl/Cmd+P to Save as PDF.');
      } catch (error) {
        vscode.window.showErrorMessage(`OpenMD PDF export failed: ${error}`);
      }
    }
  );

  context.subscriptions.push(openInBrowser, openInPreview, exportHtml, exportPdf);
}

export function deactivate() {}
