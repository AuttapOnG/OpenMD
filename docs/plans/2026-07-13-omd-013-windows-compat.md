# OMD-013 execution plan — Windows compatibility audit + CI test matrix

Spec: docs/specs/OMD-013-windows-compat.md (approved 2026-07-13).
Executor: Codex CLI in sandbox. Task token: omd013-wincompat-7f3k

## Global Constraints (READ FIRST)

- You are offline. Do NOT run any command that needs the network
  (no npm install, no API calls). All deps are already installed.
- Do NOT bind ports or run server tests. The only test commands you may
  run are the exact mocha commands written in the tasks below (they
  exclude server tests). The host runs the full suite afterwards.
- After each task, attempt `git add -A && git commit -m "<message>"`.
  If the commit fails (sandbox may not write .git), append a line
  `- [codex] commit failed for: <message>` to WORKING_STATE.md and
  continue to the next task. Never retry a failed commit.
- Do not send anything to remotes and do not run packaging/publish
  commands of any kind.
- Check off `- [x]` each checkbox as you complete it, directly in this
  file. Leave checkboxes marked **(HOST)** unchecked — they are not
  yours.
- Do not edit CLAUDE.md, AGENTS.md, .claude/**, or harness/feature_list.json.

## Task 1 — Failing unit tests for the new path helpers (TDD)

- [ ] Create `src/test/unit/paths.test.ts` with exactly:

```typescript
import * as assert from 'assert';
import * as path from 'path';
import { computeMirrorHtmlPath, toUrlPath, deriveExtensionId } from '../../paths';

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
```

- [ ] Run `npm run compile` — it MUST fail (src/paths.ts does not exist
      yet). That failure is the TDD red state; do not "fix" the test file.
- [ ] Commit: `test: failing unit tests for extracted path helpers (OMD-013)`
      (this commit is expected to contain only the test file; if tsc
      failing blocks a pre-commit hook, note it and continue).

## Task 2 — Implement src/paths.ts (green)

- [ ] Create `src/paths.ts` with exactly:

```typescript
// Pure path helpers — no vscode imports, so they are unit-testable on any
// OS by injecting path.win32 / path.posix (OMD-013 Windows audit).
import * as nodePath from 'path';

export interface MirrorPathInput {
  /** Absolute fsPath of the source .md file. */
  filePath: string;
  /** Absolute fsPath of the containing workspace folder, if any. */
  workspacePath?: string;
  /** Home directory ('' when unknown). */
  homeDir: string;
  /** Platform path module; defaults to the host platform. */
  p?: nodePath.PlatformPath;
}

const PROJECT_MARKERS = new Set(['project', 'projects', 'workspace', 'code']);

// Split a relative path into segments, dropping empties and drive-letter
// segments ("C:") so they can never leak into the mirror path or URL.
function cleanSegments(rel: string, p: nodePath.PlatformPath): string[] {
  return rel.split(p.sep).filter((s) => s !== '' && !/^[A-Za-z]:$/.test(s));
}

export function computeMirrorHtmlPath(input: MirrorPathInput): string {
  const p = input.p ?? nodePath;
  const { filePath, workspacePath, homeDir } = input;
  // Windows filesystems are case-insensitive.
  const eq = (a: string, b: string) =>
    p.sep === '\\' ? a.toLowerCase() === b.toLowerCase() : a === b;
  let segments: string[];

  if (workspacePath) {
    const workspaceName = p.basename(workspacePath);
    const relativeToWorkspace = p.relative(workspacePath, filePath);
    const workspaceParent = p.dirname(workspacePath);
    const parentName = p.basename(workspaceParent);
    const nearHome =
      homeDir !== '' && (eq(workspaceParent, homeDir) || eq(workspaceParent, p.dirname(homeDir)));
    segments = nearHome
      ? [workspaceName, ...cleanSegments(relativeToWorkspace, p)]
      : [...cleanSegments(parentName, p), workspaceName, ...cleanSegments(relativeToWorkspace, p)];
  } else {
    const parts = filePath.split(p.sep);
    const markerIndex = parts.findIndex((part) => PROJECT_MARKERS.has(part.toLowerCase()));
    segments =
      markerIndex !== -1 && markerIndex < parts.length - 1
        ? cleanSegments(parts.slice(markerIndex + 1).join(p.sep), p)
        : [p.basename(filePath)];
  }

  return segments.join(p.sep).replace(/\.md$/i, '.html');
}

/** Mirror path (native separators) → URL pathname without leading slash. */
export function toUrlPath(mirrorPath: string, p: nodePath.PlatformPath = nodePath): string {
  return mirrorPath
    .split(p.sep)
    .filter((s) => s !== '')
    .join('/');
}

/** '<publisher>.<name>-<version>' directory name → '<publisher>.<name>'. */
export function deriveExtensionId(extensionDirName: string): string {
  return extensionDirName.split('-').slice(0, -1).join('-');
}
```

- [ ] Run `npm run compile` — must pass.
- [ ] Run `npx mocha out/test/unit/paths.test.js` — all tests pass.
- [ ] Commit: `feat: extract testable cross-platform path helpers (OMD-013)`

## Task 3 — Rewire extension.ts onto the helpers

- [ ] In `src/extension.ts`:
  1. Add to the imports:
     `import { computeMirrorHtmlPath, toUrlPath, deriveExtensionId } from './paths';`
  2. DELETE the whole local `computeMirrorHtmlPath` function (the block
     from the comment `// คำนวณ mirror path ของไฟล์ ...` through its
     closing `}` — currently lines 11-49).
  3. In its place add:

```typescript
// Mirror path ของไฟล์ (เช่น /Users/x/Project/OpenMD/README.md → Project/OpenMD/README.html)
function mirrorHtmlPathFor(fileUri: vscode.Uri): string {
  return computeMirrorHtmlPath({
    filePath: fileUri.fsPath,
    workspacePath: vscode.workspace.getWorkspaceFolder(fileUri)?.uri.fsPath,
    homeDir: process.env.HOME || process.env.USERPROFILE || '',
  });
}
```

  4. Replace the extensionId line
     `const extensionId = path.basename(context.extensionPath).split('-').slice(0, -1).join('-'); // เอาชื่อ extension ไม่รวม version`
     with
     `const extensionId = deriveExtensionId(path.basename(context.extensionPath)); // เอาชื่อ extension ไม่รวม version`
  5. Replace
     `const urlPath = '/' + computeMirrorHtmlPath(fileUri).split(path.sep).join('/');`
     with
     `const urlPath = '/' + toUrlPath(mirrorHtmlPathFor(fileUri));`
  6. Replace
     `const tempHtmlPath = path.join(context.extensionPath, '.temp', computeMirrorHtmlPath(fileUri));`
     with
     `const tempHtmlPath = path.join(context.extensionPath, '.temp', mirrorHtmlPathFor(fileUri));`

- [ ] Run `npm run compile` — must pass.
- [ ] Run `npx mocha "out/test/unit/paths.test.js" "out/test/unit/render.test.js" "out/test/unit/render-features.test.js" "out/test/unit/render-math.test.js"` — all pass. (Server tests are host-only; do not run them.)
- [ ] Commit: `refactor: extension.ts uses shared path helpers (OMD-013)`

## Task 4 — Audit findings table

- [ ] Create `harness/notes/OMD-013.md` containing a findings table. Audit
      each site by READING the current code (do not assume this plan is
      right) and record verdict Fixed / Already-safe / Justified:

| Site | Risk | Verdict + note |
|---|---|---|
| extension.ts computeMirrorHtmlPath (old) | drive letters, HOME vs USERPROFILE, case-sensitivity | (fill in) |
| extension.ts urlPath construction | backslashes/colons in URL | (fill in) |
| extension.ts activation cleanup + asset staging | path.join/rmSync/cpSync semantics on Windows | (fill in) |
| extension.ts webview localResourceRoots | Uri.file/joinPath on win32 | (fill in) |
| server.ts /assets handler | URL '/' split vs native join; traversal | (fill in) |
| server.ts /mtime + page registry | registered key vs decoded request path (spaces/unicode) | (fill in) |
| render.ts | any fs/path use at all | (fill in) |
| src/test/** | hardcoded POSIX fixture paths that would break on windows-latest | (fill in) |

      Also list anything NEW you find while reading, with the same verdict
      format. If a new finding requires a code change beyond this plan's
      scope, do NOT change code — record it in the table as
      `out-of-scope: needs new feature entry`.
- [ ] Commit: `docs: OMD-013 Windows audit findings table`

## Task 5 — CI workflow

- [ ] Create `.github/workflows/ci.yml` with exactly:

```yaml
# Compile + unit tests on Linux and Windows for every push/PR (OMD-013).
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  test:
    strategy:
      fail-fast: false
      matrix:
        os: [ubuntu-latest, windows-latest]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@9c091bb21b7c1c1d1991bb908d89e4e9dddfe3e0 # v7.0.0
      - uses: actions/setup-node@48b55a011bda9f5d6aeb4c2d9c7362e8dae4041e # v6.4.0
        with:
          node-version: 20
      - run: npm ci
      - run: npm run compile
      - run: npm run test:unit
```

- [ ] Commit: `ci: compile + unit tests on ubuntu/windows matrix (OMD-013)`

## Task 6 — Host verification (leave unchecked)

- [ ] (HOST) Full unit suite incl. server tests passes on macOS.
- [ ] (HOST) Diff review; vsce manifest check.
- [ ] (HOST) Send to remote so the windows-latest CI run proves the matrix; feature stays in_progress until that run is green.
