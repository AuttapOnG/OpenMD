import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { createMarkdownParser, generateHtml, RenderAssets } from './render';

// เก็บ reference ของ webview panel
let currentPanel: vscode.WebviewPanel | undefined = undefined;

export function activate(context: vscode.ExtensionContext) {
  
  // Cleanup temp files ทุก version ตอน activate
  const extensionsDir = path.dirname(context.extensionPath);
  const extensionId = path.basename(context.extensionPath).split('-').slice(0, -1).join('-'); // เอาชื่อ extension ไม่รวม version
  
  try {
    if (fs.existsSync(extensionsDir)) {
      const entries = fs.readdirSync(extensionsDir);
      
      for (const entry of entries) {
        // หาโฟลเดอร์ที่เป็นชื่อ extension เรา (ทุก version)
        if (entry.startsWith(extensionId)) {
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
  } catch (err) {
    console.error('[OpenMD] Failed to stage assets:', err);
  }

  const browserAssets: RenderAssets = {
    mermaidJs: vscode.Uri.file(path.join(assetsDir, 'mermaid.min.js')).toString(),
    hljsJs: vscode.Uri.file(path.join(assetsDir, 'highlight.min.js')).toString(),
    hljsCssLight: vscode.Uri.file(path.join(assetsDir, 'github.min.css')).toString(),
    hljsCssDark: vscode.Uri.file(path.join(assetsDir, 'github-dark.min.css')).toString(),
  };
  
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
        const html = generateHtml(content, path.basename(fileUri.fsPath, '.md'), browserAssets, md);
        
        // Mirror path: สร้าง temp file ที่มี path สัมพันธ์กับ workspace/project
        const tempDir = path.join(context.extensionPath, '.temp');
        
        // หา relative path ที่รวมชื่อ project/folder ด้วย
        // เช่น /Users/xxx/Project/OpenMD/README.md → Project/OpenMD/README.html
        let relativePath: string;
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(fileUri);
        
        if (workspaceFolder) {
          // อยู่ใน workspace → เอา workspace name + relative path
          const workspaceName = path.basename(workspaceFolder.uri.fsPath);
          const relativeToWorkspace = path.relative(workspaceFolder.uri.fsPath, fileUri.fsPath);
          
          // หา parent folder ของ workspace (ถ้ามี)
          const workspaceParent = path.dirname(workspaceFolder.uri.fsPath);
          const grandParent = path.dirname(workspaceParent);
          const parentName = path.basename(workspaceParent);
          
          // ถ้า parent ไม่ใช่ home dir (เช่น /Users/xxx) ให้เอามาด้วย
          const homeDir = process.env.HOME || process.env.USERPROFILE || '';
          if (workspaceParent !== homeDir && workspaceParent !== path.dirname(homeDir)) {
            relativePath = path.join(parentName, workspaceName, relativeToWorkspace);
          } else {
            relativePath = path.join(workspaceName, relativeToWorkspace);
          }
        } else {
          // ไม่อยู่ใน workspace → หา project root จาก path
          const pathParts = fileUri.fsPath.split(path.sep);
          const projectIndex = pathParts.findIndex(part => 
            part === 'project' || part === 'projects' || part === 'workspace' || part === 'code'
          );
          
          if (projectIndex !== -1 && projectIndex < pathParts.length - 1) {
            relativePath = pathParts.slice(projectIndex + 1).join(path.sep);
          } else {
            relativePath = path.basename(fileUri.fsPath);
          }
        }
        
        // แปลง .md เป็น .html
        const htmlRelativePath = relativePath.replace(/\.md$/i, '.html');
        const tempHtmlPath = path.join(tempDir, htmlRelativePath);
        
        // สร้างโฟลเดอร์ถ้ายังไม่มี
        const htmlDir = path.dirname(tempHtmlPath);
        if (!fs.existsSync(htmlDir)) {
          fs.mkdirSync(htmlDir, { recursive: true });
        }
        
        fs.writeFileSync(tempHtmlPath, html);
        
        const htmlUri = vscode.Uri.file(tempHtmlPath);
        await vscode.env.openExternal(htmlUri);
        
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
                vscode.Uri.file(path.dirname(fileUri.fsPath)),
                vscode.Uri.joinPath(context.extensionUri, 'media')
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
        const mediaUri = (f: string) =>
          currentPanel!.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'media', f)).toString();
        const webviewAssets: RenderAssets = {
          mermaidJs: mediaUri('mermaid.min.js'),
          hljsJs: mediaUri('highlight.min.js'),
          hljsCssLight: mediaUri('github.min.css'),
          hljsCssDark: mediaUri('github-dark.min.css'),
        };
        const html = generateHtml(content, path.basename(fileUri.fsPath, '.md'), webviewAssets, md);
        currentPanel.webview.html = html;
        
      } catch (error) {
        vscode.window.showErrorMessage(`Error: ${error}`);
      }
    }
  );

  context.subscriptions.push(openInBrowser, openInPreview);
}

export function deactivate() {}
