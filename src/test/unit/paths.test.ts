import * as assert from 'assert';
import * as path from 'path';
import { computeMirrorHtmlPath, toUrlPath, deriveExtensionId, isOwnVersionedDir } from '../../paths';

describe('computeMirrorHtmlPath', () => {
  describe('posix', () => {
    const p = path.posix;
    const home = '/Users/x';

    it('workspace under a project dir includes the parent folder', () => {
      const out = computeMirrorHtmlPath({
        filePath: '/Users/x/Project/OpenMD/README.md',
        workspacePath: '/Users/x/Project/OpenMD',
        homeDir: home,
        p,
      });
      assert.strictEqual(out, 'Project/OpenMD/README.html');
    });

    it('workspace directly under home omits the parent folder', () => {
      const out = computeMirrorHtmlPath({
        filePath: '/Users/x/OpenMD/docs/guide.md',
        workspacePath: '/Users/x/OpenMD',
        homeDir: home,
        p,
      });
      assert.strictEqual(out, 'OpenMD/docs/guide.html');
    });

    it('workspace whose parent is the home parent omits the parent folder', () => {
      const out = computeMirrorHtmlPath({
        filePath: '/Users/ws/a.md',
        workspacePath: '/Users/ws',
        homeDir: home,
        p,
      });
      assert.strictEqual(out, 'ws/a.html');
    });

    it('no workspace: project marker is matched case-insensitively', () => {
      const out = computeMirrorHtmlPath({
        filePath: '/Users/x/Project/demo/notes.md',
        workspacePath: undefined,
        homeDir: home,
        p,
      });
      assert.strictEqual(out, 'demo/notes.html');
    });

    it('no workspace and no marker falls back to the basename', () => {
      const out = computeMirrorHtmlPath({
        filePath: '/opt/stuff/readme.md',
        workspacePath: undefined,
        homeDir: home,
        p,
      });
      assert.strictEqual(out, 'readme.html');
    });

    it('uppercase .MD extension still becomes .html', () => {
      const out = computeMirrorHtmlPath({
        filePath: '/Users/x/OpenMD/NOTES.MD',
        workspacePath: '/Users/x/OpenMD',
        homeDir: home,
        p,
      });
      assert.strictEqual(out, 'OpenMD/NOTES.html');
    });
  });

  describe('win32', () => {
    const p = path.win32;
    const home = 'C:\\Users\\x';

    it('workspace under a project dir uses win32 separators, no drive letter', () => {
      const out = computeMirrorHtmlPath({
        filePath: 'C:\\Users\\x\\Project\\OpenMD\\README.md',
        workspacePath: 'C:\\Users\\x\\Project\\OpenMD',
        homeDir: home,
        p,
      });
      assert.strictEqual(out, 'Project\\OpenMD\\README.html');
    });

    it('home comparison is case-insensitive on win32', () => {
      const out = computeMirrorHtmlPath({
        filePath: 'C:\\Users\\x\\OpenMD\\a.md',
        workspacePath: 'C:\\Users\\x\\OpenMD',
        homeDir: 'c:\\users\\X',
        p,
      });
      assert.strictEqual(out, 'OpenMD\\a.html');
    });

    it('workspace at the drive root produces no empty or drive segments', () => {
      const out = computeMirrorHtmlPath({
        filePath: 'C:\\ws\\a.md',
        workspacePath: 'C:\\ws',
        homeDir: home,
        p,
      });
      assert.strictEqual(out, 'ws\\a.html');
    });

    it('no workspace: marker match works on win32 paths', () => {
      const out = computeMirrorHtmlPath({
        filePath: 'C:\\Code\\demo\\notes.md',
        workspacePath: undefined,
        homeDir: home,
        p,
      });
      assert.strictEqual(out, 'demo\\notes.html');
    });

    it('no workspace, no marker: drive letter never leaks into the result', () => {
      const out = computeMirrorHtmlPath({
        filePath: 'C:\\stuff\\readme.md',
        workspacePath: undefined,
        homeDir: home,
        p,
      });
      assert.strictEqual(out, 'readme.html');
    });

    it('empty homeDir still includes the parent folder', () => {
      const out = computeMirrorHtmlPath({
        filePath: 'C:\\Users\\x\\Work\\OpenMD\\a.md',
        workspacePath: 'C:\\Users\\x\\Work\\OpenMD',
        homeDir: '',
        p,
      });
      assert.strictEqual(out, 'Work\\OpenMD\\a.html');
    });
  });
});

describe('toUrlPath', () => {
  it('converts win32 mirror paths to forward-slash URL paths', () => {
    assert.strictEqual(toUrlPath('Project\\OpenMD\\README.html', path.win32), 'Project/OpenMD/README.html');
  });

  it('never emits backslashes or colons for win32 input', () => {
    const out = toUrlPath('Work\\OpenMD\\a b\\c.html', path.win32);
    assert.ok(!out.includes('\\'), 'no backslashes');
    assert.ok(!out.includes(':'), 'no colons');
  });

  it('passes posix paths through unchanged', () => {
    assert.strictEqual(toUrlPath('Project/OpenMD/README.html', path.posix), 'Project/OpenMD/README.html');
  });
});

describe('deriveExtensionId', () => {
  it('strips the trailing version from an extension dir name', () => {
    assert.strictEqual(deriveExtensionId('auttapong-tura.openmd-1.3.0'), 'auttapong-tura.openmd');
  });
});

describe('isOwnVersionedDir', () => {
  const id = 'auttapong-tura.openmd';
  it('matches our own versioned dir', () => {
    assert.strictEqual(isOwnVersionedDir('auttapong-tura.openmd-1.3.2', id), true);
  });
  it('rejects a foreign extension sharing our ID as prefix', () => {
    assert.strictEqual(isOwnVersionedDir('auttapong-tura.openmd-pro-1.0.0', id), false);
  });
  it('accepts a pre-release version suffix', () => {
    assert.strictEqual(isOwnVersionedDir('auttapong-tura.openmd-1.4.0-preview.1', id), true);
  });
  it('rejects the bare ID with no version', () => {
    assert.strictEqual(isOwnVersionedDir('auttapong-tura.openmd', id), false);
  });
});
