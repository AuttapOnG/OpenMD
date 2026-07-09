# Spec: Keep only the latest vsix tracked in git

**Status:** approved
**Date:** 2026-07-09
**Feature:** OMD-007

## Goal
Stop the repository from accumulating release artifacts: track exactly one
vsix (the current release) and untrack the six older ones.

## Background
Seven `.vsix` files are tracked (~72 MB working tree; 0.1.6–1.0.0 are ~24 MB
each). The user wants the current release kept in the repo so it can be
installed directly without the marketplace. No history rewrite (would require
a force push).

## Requirements
- [ ] `.gitignore` gains `*.vsix` with a negation for the current release
      (`!openmd-1.2.0.vsix`)
- [ ] `git rm --cached` the six older vsix files (files stay on disk)
- [ ] The release convention is written down for agents: CLAUDE.md and
      AGENTS.md state that only the latest vsix is tracked and that a release
      must update the `.gitignore` exception and untrack the previous vsix;
      a dated entry goes in harness/progress.md cross-cutting log
- [ ] CLAUDE.md change noted in WORKING_STATE.md (harness rule)

## Out of Scope
- Rewriting git history (filter-repo / force push)
- Deleting vsix files from disk
- GitHub Releases automation

## Success Criteria
- `git ls-files '*.vsix'` lists exactly `openmd-1.2.0.vsix`
- `git status` clean after commit; old vsix files still exist on disk
- CLAUDE.md, AGENTS.md, and harness/progress.md document the convention

## Open Questions
- None
