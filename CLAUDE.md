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
- Commit frequently with descriptive messages — commits are the action log
- In-flight context a commit can't carry (dead ends, pending manual steps,
  mid-task state) goes in the feature's `harness/notes/OMD-NNN.md`
- Never modify `.claude/settings.json` or `CLAUDE.md` without a dated entry
  in the cross-cutting log in `harness/progress.md`

Human checkpoints are enforced regardless of autonomy:
- Pushing: `git push` triggers a permission prompt (ask rule) — the human
  approves each push in the Claude Code UI. Never obfuscate or wrap the
  command to avoid the prompt.
- Local publishing (`vsce publish`, `ovsx publish`, `npm publish`) is
  hook-blocked outright — releases go through CI only (see Release
  Convention).
- File deletion (`rm`, `rmdir`, `git clean`) — hook-blocked
- External network calls (`curl`, `wget`, `fetch`) — hook-blocked

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
   Marketplace + Open VSX (OMD-011). Never run vsce/ovsx publish locally.
5. Immediately create the GitHub Release yourself:
   `gh release create vX --title vX --notes "<CHANGELOG entry>"` — CI does
   NOT create it (deliberate: releases stay human-controlled); CI only
   attaches the vsix if the Release already exists, silently skipping
   otherwise. After the run, `gh release view vX` to confirm the vsix is
   attached; if not, `gh release upload vX openmd-X.vsix`.

Details + token reissue guide: `docs/RELEASE.md`. Marketplace shows the
new version only after ~5-10 min of validation.

## Self-Verification Checklist
Before saying "done", verify:
- [ ] Task matches spec
- [ ] `npm run compile` succeeds and all tests pass
- [ ] No secrets in diff
- [ ] harness/notes/OMD-NNN.md updated for the feature touched
- [ ] harness/feature_list.json and harness/progress.md updated
