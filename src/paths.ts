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

/**
 * True only when `entry` is one of OUR versioned extension dirs:
 * exactly '<extensionId>-<version>' where version is N.N.N with an
 * optional pre-release/build suffix. A foreign extension whose ID merely
 * starts with ours (e.g. 'publisher.openmd-pro-1.0.0') must NOT match.
 */
export function isOwnVersionedDir(entry: string, extensionId: string): boolean {
  if (!entry.startsWith(extensionId + '-')) return false;
  const version = entry.slice(extensionId.length + 1);
  return /^\d+\.\d+\.\d+(?:[-.][0-9A-Za-z.-]+)?$/.test(version);
}
