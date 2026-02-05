import * as path from 'path';
import { runTests } from '@vscode/test-electron';

async function main() {
  try {
    // โฟลเดอร์ที่มี extension
    const extensionDevelopmentPath = path.resolve(__dirname, '../../');
    
    // โฟลเดอร์ที่มี test file
    const extensionTestsPath = path.resolve(__dirname, './suite/index');

    // ดาวน์โหลด VS Code และรันเทส
    await runTests({
      extensionDevelopmentPath,
      extensionTestsPath,
    });
  } catch (err) {
    console.error('Failed to run tests');
    process.exit(1);
  }
}

main();
