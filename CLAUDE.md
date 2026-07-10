# OpenMD

## Project Context
- **Type:** VS Code extension (Markdown preview — open .md files in browser or preview panel)
- **Stack:** TypeScript + VS Code Extension API, markdown-it (+ plugins), Mermaid, highlight.js
- **Team:** solo

## Context & Memory Rules
At the start of every session:
1. Run `bash init.sh`
2. Read `harness/progress.md` (Current State + Feature index)
3. Load the feature you are working on: its entry in
   `harness/feature_list.json` and its note file `harness/notes/OMD-NNN.md`
4. Load any approved spec from `docs/specs/`

## Constraints (HIGH AUTONOMY)
You may act autonomously on all tasks. Maintain an audit trail:
- Log every significant action to `WORKING_STATE.md`
- Commit frequently with descriptive messages
- Never modify `.claude/settings.json` or `CLAUDE.md` without noting it in `WORKING_STATE.md`

Human checkpoints are enforced by hooks regardless of autonomy:
- Publishing / pushing (`git push`, `vsce publish`, `ovsx publish`)
- File deletion (`rm`, `rmdir`, `git clean`)
- External network calls (`curl`, `wget`, `fetch`)

## Work Control (harness memory)
`harness/feature_list.json` is the single source of truth for what is done
and what is next. Follow the update discipline in `harness/README.md`:
- Set a feature `in_progress` before starting; `done` only after every
  acceptance criterion is verified.
- Per-feature details go in `harness/notes/OMD-NNN.md`; cross-feature
  decisions go in the dated cross-cutting log in `harness/progress.md`.
- New work discovered mid-feature becomes a new feature entry — never
  silently expand scope.

## Feature Workflow
New work follows: spec in `docs/specs/` (approved by the human) → plan in
`docs/plans/` → feature entries in `harness/feature_list.json` → TDD
execution (failing test → minimal code → pass → commit).

## Workflow
1. Read spec → plan → execute → verify → commit
2. Prefer small, reversible changes over large sweeping edits
3. Build with `npm run compile`; package with `npm run package` (vsce)
4. Run self-verification before closing any task

## Release Convention (vsix artifacts)
Only the CURRENT release vsix is tracked in git. When releasing version X:
1. Update the `.gitignore` exception (`!openmd-X.vsix`, remove the old one)
2. `git rm` the previous release's vsix (delete from tracking and disk)
3. Commit the new vsix together with the release commit
4. Tag `vX` and push the tag — GitHub Actions publishes to the VS Code
   Marketplace + Open VSX and attaches the vsix to the GitHub Release
   (OMD-011). Never run vsce/ovsx publish locally. Details + token
   reissue guide: `docs/RELEASE.md`. Marketplace shows the new version
   only after ~5-10 min of validation.

## Self-Verification Checklist
Before saying "done", verify:
- [ ] Task matches spec
- [ ] `npm run compile` succeeds and all tests pass
- [ ] No secrets in diff
- [ ] WORKING_STATE.md updated
- [ ] harness/feature_list.json and harness/progress.md updated
