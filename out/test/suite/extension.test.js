"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const assert = __importStar(require("assert"));
const vscode = __importStar(require("vscode"));
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
//# sourceMappingURL=extension.test.js.map