# OpenMD — Agent Instructions

## Project
- Type: VS Code extension (Markdown preview — open .md files in browser or preview panel)
- Stack: TypeScript + VS Code Extension API, markdown-it (+ plugins), Mermaid, highlight.js
- Team: solo

## Session Start
1. Run `bash init.sh` if present
2. Read `harness/progress.md` (Current State + Feature index)
3. Load the feature you are working on: its entry in
   `harness/feature_list.json` and its note file `harness/notes/OMD-NNN.md`
4. Load approved specs from `docs/specs/`

## Rules (HIGH AUTONOMY)
Act autonomously. Commit frequently — commits are the action log; in-flight
context a commit can't carry goes in the feature's harness/notes/OMD-NNN.md.
Prefer small reversible changes.

Always ask a human before: publishing or pushing (`git push`, `vsce publish`,
`ovsx publish`), deleting files, or making external network calls.

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

## Release Convention (vsix artifacts)
Only the CURRENT release vsix is tracked in git. When releasing version X:
update the `.gitignore` exception (`!openmd-X.vsix`), remove the previous
release's vsix from tracking and disk, and commit the new vsix with the
release commit. Then tag `vX` and push the tag — GitHub Actions publishes
to the VS Code Marketplace + Open VSX (OMD-011). Immediately after pushing
the tag, create the GitHub Release yourself (`gh release create vX ...`) —
CI does NOT create it (deliberate; human-controlled) and only attaches the
vsix to an existing Release, silently skipping otherwise; verify with
`gh release view vX` after the run. Never run vsce/ovsx publish locally;
see docs/RELEASE.md for the full flow and token reissue guide.

## Self-Check
- [ ] Matches spec
- [ ] `npm run compile` succeeds and tests pass
- [ ] No secrets in diff
- [ ] harness/notes/OMD-NNN.md updated for the feature touched
- [ ] harness/feature_list.json and harness/progress.md updated
