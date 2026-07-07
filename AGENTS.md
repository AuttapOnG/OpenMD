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
Act autonomously. Log significant actions in WORKING_STATE.md.
Prefer small reversible changes. Commit frequently.

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

## Self-Check
- [ ] Matches spec
- [ ] `npm run compile` succeeds and tests pass
- [ ] No secrets in diff
- [ ] WORKING_STATE.md updated
- [ ] harness/feature_list.json and harness/progress.md updated
