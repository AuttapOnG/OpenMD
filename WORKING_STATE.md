# Working State

## 2026-07-09

- OMD-007: deleted six old vsix files (0.1.4–1.1.0) from tracking and disk per
  explicit human approval; `.gitignore` now ignores `*.vsix` except the
  current release. Modified `CLAUDE.md` and `AGENTS.md` to add the Release
  Convention section documenting this (noted here per harness rule).
- Started OMD-009 implementation on branch `feat/omd-009-auto-refresh`.
  Following `docs/plans/2026-07-09-omd-009-auto-refresh.md` task by task;
  manual F5 smoke test will remain unchecked for the human.
- Completed OMD-009 Task 1 live-reload render tests and implementation;
  `npm run test:unit` reports 7 passing tests.
- Task 1 commit attempt failed because the sandbox cannot write
  `.git/index.lock` (`Operation not permitted`).
- Implemented OMD-009 Task 2 `PreviewServer` and unit tests. Verification via
  `npm run test:unit` is blocked in this sandbox because Node cannot bind
  `127.0.0.1` (`listen EPERM`); render tests reached 7 passing before the
  PreviewServer before-hook failed.
- Task 2 commit attempt failed because the sandbox cannot write
  `.git/index.lock` (`Operation not permitted`).
- Implemented OMD-009 Task 3 extension wiring: browser previews now use the
  lazy loopback server when available with static temp-file fallback, and the
  preview panel re-renders on `onDidSaveTextDocument`.
- Task 3 verification: `npm run compile && npm run test:unit && npm run build`
  compiled successfully but stopped during `npm run test:unit` on sandbox
  `listen EPERM` for `127.0.0.1`; `npm run build` was run separately and
  succeeded.
- Task 3 commit attempt failed because the sandbox cannot write
  `.git/index.lock` (`Operation not permitted`).
- Completed OMD-009 Task 4 release prep: bumped `package.json` to 1.2.0,
  updated `CHANGELOG.md`, and `npm run package && ls -lh openmd-1.2.0.vsix`
  succeeded. Generated `openmd-1.2.0.vsix` is 926K.
- Updated harness memory with OMD-009 still `in_progress`; manual F5 smoke
  test remains pending for the human.
- Task 4 commit attempt failed because the sandbox cannot write
  `.git/index.lock` (`Operation not permitted`).
- Modified `.claude/settings.json`: replaced invalid `permissions.allow: ["*"]`
  (wildcard tool names are not legal in allow rules — the rule was being
  silently skipped) with an explicit allow list (Read, Edit, Write, Glob,
  Grep, Bash, WebSearch). Deny rules and all PreToolUse checkpoint hooks
  unchanged. Approved by the human.

## 2026-07-08

- Started OMD-008 implementation on branch `feat/omd-008-bundle-offline`.
- Verified pre-installed esbuild exists in `node_modules` (`0.28.1`); no network install was run.
- Completed Task 1 build pipeline setup; `npm run build` produced `dist/extension.js` and four `media/` assets.
- Task 1 commit attempt failed because the sandbox cannot write `.git/index.lock` (`Operation not permitted`).
- Completed Task 2 render extraction test path; `npm run test:unit` reports 5 passing tests.
- Task 2 commit attempt failed because the sandbox cannot write `.git/index.lock` (`Operation not permitted`).
- Completed Task 3 wiring; `npm run compile`, `npm run test:unit`, and `npm run build` passed, with zero `cdnjs`/`jsdelivr` matches in generated source modules.
- Task 3 commit attempt failed because the sandbox cannot write `.git/index.lock` (`Operation not permitted`).
- Completed Task 4 package verification; `openmd-1.1.0.vsix` is 924K and `npx vsce ls` shows `dist/extension.js`, four `media/` assets, and no `node_modules` entries.
- Task 4 commit attempt failed because the sandbox cannot write `.git/index.lock` (`Operation not permitted`).
