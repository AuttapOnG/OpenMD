# ADR-0001: Harness Initialization

**Date:** 2026-07-07
**Status:** accepted

## Context
This project needed a harness engineering scaffold to make agent work reliable and observable.
The harness was initialized using `/init-harness` based on the following project profile:

- Project type: VS Code extension (Markdown preview)
- Stack: TypeScript + VS Code Extension API, markdown-it, Mermaid, highlight.js
- Team size: solo
- Autonomy level: high
- Checkpoints: before publish / git push, before file deletion, before external network calls
- Environment: local development
- Sensitive data: none
- Deploy target: VS Code Marketplace / Open VSX (vsce / ovsx publish)

## Decision
Initialize a full harness scaffold with high autonomy constraints,
publish/push + file-deletion + network-call checkpoints, and permissive permissions.

## Consequences
- Agents operating in this repo follow CLAUDE.md and AGENTS.md constraints
- init.sh must be run at the start of each session
- All risky actions are gated by settings.json hooks
- Harness can be evolved by editing these files; changes should be recorded as new ADRs
