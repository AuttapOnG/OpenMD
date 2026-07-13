# Spec: Activation cleanup must not match foreign extensions by ID prefix (OMD-017)

**Status:** draft
**Date:** 2026-07-13

## Goal
Make the activation-time temp cleanup select only OpenMD's own versioned
extension directories, so an unrelated extension whose ID shares our ID as
a prefix never has its `.temp` directory deleted.

## Background
On activation, `extension.ts` scans the sibling directories of
`context.extensionPath` and deletes `<dir>/.temp` for every entry where
`entry.startsWith(extensionId)` (`src/extension.ts:33`). VS Code names
extension directories `<publisher>.<name>-<version>`. The prefix test
therefore also matches a different extension whose ID merely extends ours
— e.g. `auttapong-tura.openmd-pro-1.0.0` starts with
`auttapong-tura.openmd` — and its `.temp` directory would be recursively
removed. Found by the OMD-013 Windows audit; pre-existing behavior, not
Windows-specific.

## Requirements
- [ ] Add a pure helper in `src/paths.ts` (proposed:
      `isOwnVersionedDir(entry: string, extensionId: string): boolean`)
      that returns true only when `entry` is exactly
      `<extensionId>-<version>`, where `<version>` is `N.N.N` with an
      optional pre-release/build suffix (e.g. `1.3.0`, `1.4.0-preview.1`).
      No `vscode` imports (unit-testable, same as the OMD-013 helpers).
- [ ] `extension.ts` cleanup uses this helper instead of `startsWith`.
- [ ] Unit tests in `src/test/unit/paths.test.ts` cover at minimum:
      own dir (`auttapong-tura.openmd-1.3.2`) → true;
      prefix collision (`auttapong-tura.openmd-pro-1.0.0`) → false;
      pre-release suffix (`auttapong-tura.openmd-1.4.0-preview.1`) → true;
      bare ID with no version (`auttapong-tura.openmd`) → false.

## Out of Scope
- `deriveExtensionId` (`src/paths.ts:63`) keeps its current
  last-`-`-segment heuristic; it derives our own ID from our own dir name,
  which VS Code always suffixes with a plain `N.N.N` version.
- Any change to what gets deleted inside a matched dir (still only `.temp`).

## Success Criteria
- All new unit tests pass; full suite (`npm run test:unit`) stays green.
- `npm run compile` succeeds.
- Manual check: cleanup log on activation still reports our own old
  versions and nothing else.

## Open Questions
- None — small, self-contained fix.
