# Harness memory

How agents track and control work in this repo.

## Files

- `feature_list.json` — the implementation queue. Every unit of work is a
  feature with an ID (OMD-NNN), status (`pending` / `in_progress` /
  `done`), priority, and acceptance criteria. Single source of truth for
  what is done and what is next.
- `progress.md` — slim, bounded memory with exactly three sections:
  **Current State**, **Feature index**, **Cross-cutting decisions & events**.
- `notes/OMD-NNN.md` — one note file per feature: decisions, gotchas,
  and implementation details, so agents only load what a feature needs.
- `evals/` — agent behavior evaluations. `traces/` — observability stub.

## Update discipline

1. Set a feature `in_progress` in `feature_list.json` before starting it.
2. Record decisions and surprises in `notes/OMD-NNN.md` as you go.
3. On completion: verify every acceptance criterion, set status `done`,
   update **Current State** and the **Feature index** in `progress.md`.
4. Decisions affecting more than one feature go in **Cross-cutting
   decisions & events** (dated, one bullet each).
5. New work discovered mid-feature becomes a NEW feature entry — never
   silently expand scope.

Environment bootstrap: `bash init.sh`. Specs live in `docs/specs/`;
step-by-step plans in `docs/plans/`.
