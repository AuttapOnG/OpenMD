# Plan: OMD-017 — cleanup must not match foreign extensions by ID prefix

Spec: `docs/specs/OMD-017-cleanup-prefix-collision.md` (approved 2026-07-13)

## Global Constraints
- Sandbox: no network access, do not run any server/integration tests
  (port binding fails — this includes the full `test:unit` script, which
  runs server tests). Only run these two commands:
  `npm run compile` and `npx mocha out/test/unit/paths.test.js`.
- Do NOT run any git commands (no add/commit/tag). The host reviews and
  commits after you finish.
- Do not modify any files other than the three listed below.
- Check off each checkbox in THIS file as you complete it.
- If a step fails, log the failure under a `## Failures` heading at the
  bottom of this file and stop.

## Task 1 — failing tests first (TDD red)

- [x] In `src/test/unit/paths.test.ts`, import `isOwnVersionedDir` from
  `../../paths` (extend the existing import) and append this describe
  block at the end of the file:

```ts
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
```

- [x] Run `npm run compile` and confirm it FAILS (TS error:
  `isOwnVersionedDir` does not exist yet). This is the TDD red state.

## Task 2 — implement the helper (green)

- [x] Append to `src/paths.ts` (keep existing code untouched):

```ts
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
```

- [x] Run `npm run compile` (must now succeed) then
  `npx mocha out/test/unit/paths.test.js` and confirm ALL tests pass.

## Task 3 — wire it into activation cleanup

- [x] In `src/extension.ts`: add `isOwnVersionedDir` to the existing
  import from `./paths`, and change the cleanup condition (currently
  `if (entry.startsWith(extensionId)) {` around line 33) to
  `if (isOwnVersionedDir(entry, extensionId)) {`.
- [x] Run `npm run compile` and confirm it succeeds.
- [x] Run the unit-test command one final time and confirm green.
