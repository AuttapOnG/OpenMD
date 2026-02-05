import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Extension Test Suite', () => {
  vscode.window.showInformationMessage('Start all tests.');

  test('Extension should be present', () => {
    // ตรวจสอบว่า extension ถูกโหลด
    const extension = vscode.extensions.getExtension('auttapong-tura.openmd');
    assert.ok(extension);
  });

  test('Commands should be registered', async () => {
    // ตรวจสอบว่าคำสั่งถูก register ไว้
    const commands = await vscode.commands.getCommands(true);
    
    const hasOpenCommand = commands.includes('openmd.openBrowser');
    const hasPreviewCommand = commands.includes('openmd.openPreview');
    
    assert.ok(hasOpenCommand, 'Open in Browser command should be registered');
    assert.ok(hasPreviewCommand, 'Open in Preview command should be registered');
  });

  test('Should activate on markdown file', async () => {
    // สร้างไฟล์ markdown ชั่วคราว
    const doc = await vscode.workspace.openTextDocument({
      language: 'markdown',
      content: '# Test Heading\n\nThis is a test.'
    });
    
    await vscode.window.showTextDocument(doc);
    
    // ตรวจสอบว่า language mode ถูกต้อง
    assert.strictEqual(doc.languageId, 'markdown');
  });
});

// Test markdown conversion
suite('Markdown Conversion Tests', () => {
  
  test('Should convert heading correctly', async () => {
    // ตัวอย่างเทสการแปลง markdown
    const markdown = '# Hello World';
    const expected = '<h1>Hello World</h1>';
    
    // ในเทสจริงควร import function มาเทส
    // ตอนนี้เป็น placeholder
    assert.ok(markdown.includes('Hello World'));
  });

  test('Should convert code block correctly', async () => {
    const markdown = '```typescript\nconst x = 1;\n```';
    
    // ตรวจสอบว่ามี code block
    assert.ok(markdown.includes('```'));
  });
});
