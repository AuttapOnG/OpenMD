# Working State

## 2026-07-09

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
